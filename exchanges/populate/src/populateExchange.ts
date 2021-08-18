import {
  DocumentNode,
  buildClientSchema,
  FragmentDefinitionNode,
  GraphQLSchema,
  GraphQLInterfaceType,
  IntrospectionQuery,
  isCompositeType,
  isAbstractType,
  Kind,
  SelectionSetNode,
  GraphQLObjectType,
  SelectionNode,
  valueFromASTUntyped,
} from "graphql";

import { pipe, tap, map } from "wonka";
import { Exchange, Operation, stringifyVariables } from "@urql/core";

import { warn } from "./helpers/help";
import {
  getName,
  getSelectionSet,
  unwrapType,
  createNameNode,
} from "./helpers/node";
import {
  traverse,
  resolveFields,
  getUsedFragmentNames,
} from "./helpers/traverse";

interface PopulateExchangeOpts {
  schema: IntrospectionQuery;
}

/** @populate stores information per each type it finds */
type TypeKey = GraphQLObjectType | GraphQLInterfaceType;
/** @populate stores all known fields per each type key */
type TypeFields = Map<TypeKey, Record<string, FieldUsage>>;
/** @populate stores all fields returning a specific type */
type TypeParents = Map<TypeKey, Set<FieldUsage>>;
/** Describes information about a given field, i.e. type (owner), arguments, how many operations use this field */
interface FieldUsage {
  type: TypeKey;
  args: null | object;
  fieldName: string;
}

const makeDict = (): any => Object.create(null);

/** An exchange for auto-populating mutations with a required response body. */
export const populateExchange =
  ({ schema: ogSchema }: PopulateExchangeOpts): Exchange =>
  ({ forward }) => {
    const schema = buildClientSchema(ogSchema);
    /** List of operation keys that have already been parsed. */
    const parsedOperations = new Set<number>();
    /** List of operation keys that have not been torn down. */
    const activeOperations = new Set<number>();
    /** Collection of fragments used by the user. */
    const userFragments: UserFragmentMap = makeDict();
    /** Collection of actively in use type fragments. */
    const activeTypeFragments: TypeFragmentMap = makeDict();

    // State of the global types & their fields
    const typeFields: TypeFields = new Map();
    const typeParents: TypeParents = new Map();

    // State of the current operation
    // const currentVisited: Set<string> = new Set();
    let currentVariables: object = {};

    const readFromSelectionSet = (
      type: GraphQLObjectType | GraphQLInterfaceType,
      selections: readonly SelectionNode[],
      seenFields: Record<string, TypeKey> = {}
    ) => {
      if (isAbstractType(type)) {
        // TODO: should we add this to typeParents/typeFields as well?
        schema.getPossibleTypes(type).forEach((t) => {
          readFromSelectionSet(t, selections, seenFields);
        });
      } else {
        const fieldMap = type.getFields();

        let args: null | Record<string, any> = null;
        for (let i = 0; i < selections.length; i++) {
          const selection = selections[i];
          if (selection.kind !== Kind.FIELD) continue;

          const fieldName = selection.name.value;
          if (!fieldMap[fieldName]) continue;

          const ownerType =
            seenFields[fieldName] || (seenFields[fieldName] = type);

          let fields = typeFields.get(ownerType);
          if (!fields) typeFields.set(type, (fields = {}));

          const childType = unwrapType(
            fieldMap[fieldName].type
          ) as GraphQLObjectType;

          if (selection.arguments && selection.arguments.length) {
            args = {};
            for (let j = 0; j < selection.arguments.length; j++) {
              const argNode = selection.arguments[j];
              args[argNode.name.value] = valueFromASTUntyped(
                argNode.value,
                currentVariables
              );
            }
          }

          const fieldKey = args
            ? `${fieldName}:${stringifyVariables(args)}`
            : fieldName;

          const field =
            fields[fieldKey] ||
            (fields[fieldKey] = {
              type: childType,
              args,
              fieldName,
            });

          if (selection.selectionSet) {
            let parents = typeParents.get(childType);
            if (!parents) {
              parents = new Set();
              typeParents.set(childType, parents);
            }

            parents.add(field);
            readFromSelectionSet(childType, selection.selectionSet.selections);
          }
        }
      }
    };

    const readFromQuery = (node: DocumentNode) => {
      for (let i = 0; i < node.definitions.length; i++) {
        const definition = node.definitions[i];
        if (definition.kind !== Kind.OPERATION_DEFINITION) continue;
        const type = schema.getQueryType()!;
        readFromSelectionSet(
          unwrapType(type) as GraphQLObjectType,
          definition.selectionSet.selections!
        );
      }
    };

    /** Handle mutation and inject selections + fragments. */
    const handleIncomingMutation = (op: Operation) => {
      if (op.kind !== "mutation") {
        return op;
      }

      const activeSelections: TypeFragmentMap = makeDict();
      for (const name in activeTypeFragments) {
        activeSelections[name] = activeTypeFragments[name].filter((s) =>
          activeOperations.has(s.key)
        );
      }

      return {
        ...op,
        query: addFragmentsToQuery(
          schema,
          op.query,
          activeSelections,
          userFragments
        ),
      };
    };

    /** Handle query and extract fragments. */
    const handleIncomingQuery = ({
      key,
      kind,
      query,
      variables,
    }: Operation) => {
      if (kind !== "query") {
        return;
      }

      activeOperations.add(key);
      if (parsedOperations.has(key)) {
        return;
      }

      parsedOperations.add(key);
      currentVariables = variables || {};
      readFromQuery(query);

      const [extractedFragments, newFragments] = extractSelectionsFromQuery(
        schema,
        query
      );

      for (let i = 0, l = extractedFragments.length; i < l; i++) {
        const fragment = extractedFragments[i];
        userFragments[getName(fragment)] = fragment;
      }

      for (let i = 0, l = newFragments.length; i < l; i++) {
        const fragment = newFragments[i];
        const type = getName(fragment.typeCondition);
        const current =
          activeTypeFragments[type] || (activeTypeFragments[type] = []);

        (fragment as any).name.value += current.length;
        current.push({ key, fragment });
      }
    };

    const handleIncomingTeardown = ({ key, kind }: Operation) => {
      if (kind === "teardown") {
        activeOperations.delete(key);
      }
    };

    return (ops$) => {
      return pipe(
        ops$,
        tap(handleIncomingQuery),
        tap(handleIncomingTeardown),
        map(handleIncomingMutation),
        forward
      );
    };
  };

type UserFragmentMap<T extends string = string> = Record<
  T,
  FragmentDefinitionNode
>;

type TypeFragmentMap<T extends string = string> = Record<T, TypeFragment[]>;

interface TypeFragment {
  /** Operation key where selection set is being used. */
  key: number;
  /** Selection set. */
  fragment: FragmentDefinitionNode;
}

/** Gets typed selection sets and fragments from query */
export const extractSelectionsFromQuery = (
  schema: GraphQLSchema,
  query: DocumentNode
) => {
  const extractedFragments: FragmentDefinitionNode[] = [];
  const newFragments: FragmentDefinitionNode[] = [];

  const sanitizeSelectionSet = (
    selectionSet: SelectionSetNode,
    type: string
  ) => {
    const selections: SelectionNode[] = [];
    const validTypes = (schema.getType(type) as GraphQLObjectType).getFields();
    const validTypeProperties = Object.keys(validTypes);

    selectionSet.selections.forEach((selection) => {
      if (selection.kind === Kind.FIELD) {
        if (validTypeProperties.includes(selection.name.value)) {
          if (selection.selectionSet) {
            selections.push({
              ...selection,
              selectionSet: sanitizeSelectionSet(
                selection.selectionSet,
                unwrapType(validTypes[selection.name.value].type)!.toString()
              ),
            });
          } else {
            selections.push(selection);
          }
        }
      } else {
        selections.push(selection);
      }
    });

    return { ...selectionSet, selections };
  };

  const visits: string[] = [];

  traverse(
    query,
    (node) => {
      if (node.kind === Kind.FRAGMENT_DEFINITION) {
        extractedFragments.push(node);
      } else if (node.kind === Kind.FIELD && node.selectionSet) {
        const type = unwrapType(
          resolveFields(schema, visits)[node.name.value].type
        );

        visits.push(node.name.value);

        if (isAbstractType(type)) {
          const types = schema.getPossibleTypes(type);
          types.forEach((t) => {
            newFragments.push({
              kind: Kind.FRAGMENT_DEFINITION,
              typeCondition: {
                kind: Kind.NAMED_TYPE,
                name: createNameNode(t.toString()),
              },
              name: createNameNode(`${t.toString()}_PopulateFragment_`),
              selectionSet: sanitizeSelectionSet(
                node.selectionSet as SelectionSetNode,
                t.toString()
              ),
            });
          });
        } else if (type) {
          newFragments.push({
            kind: Kind.FRAGMENT_DEFINITION,
            typeCondition: {
              kind: Kind.NAMED_TYPE,
              name: createNameNode(type.toString()),
            },
            name: createNameNode(`${type.toString()}_PopulateFragment_`),
            selectionSet: node.selectionSet,
          });
        }
      }
    },
    (node) => {
      if (node.kind === Kind.FIELD && node.selectionSet) visits.pop();
    }
  );

  return [extractedFragments, newFragments];
};

/** Replaces populate decorator with fragment spreads + fragments. */
export const addFragmentsToQuery = (
  schema: GraphQLSchema,
  query: DocumentNode,
  activeTypeFragments: TypeFragmentMap,
  userFragments: UserFragmentMap
): DocumentNode => {
  const requiredUserFragments: Record<string, FragmentDefinitionNode> =
    makeDict();

  const additionalFragments: Record<string, FragmentDefinitionNode> =
    makeDict();

  /** Fragments provided and used by the current query */
  const existingFragmentsForQuery: Set<string> = new Set();

  return traverse(
    query,
    (node) => {
      if (node.kind === Kind.DOCUMENT) {
        node.definitions.reduce((set, definition) => {
          if (definition.kind === Kind.FRAGMENT_DEFINITION) {
            set.add(definition.name.value);
          }

          return set;
        }, existingFragmentsForQuery);
      } else if (
        node.kind === Kind.OPERATION_DEFINITION ||
        node.kind === Kind.FIELD
      ) {
        if (!node.directives) return;

        const directives = node.directives.filter(
          (d) => getName(d) !== "populate"
        );

        if (directives.length === node.directives.length) return;

        if (node.kind === Kind.OPERATION_DEFINITION) {
          // TODO: gather dependent queries and update mutation operation with multiple
          // query operations.

          return {
            ...node,
            directives,
          };
        }

        /*if (node.name.value === "viewer") {
          // TODO: populate the viewer fields
          return {
            ...node,
            directives,
          };
        }*/

        const fieldMap = schema.getMutationType()!.getFields()[node.name.value];

        if (!fieldMap) return;

        const type = unwrapType(fieldMap.type);

        let possibleTypes: readonly GraphQLObjectType<any, any>[] = [];
        if (!isCompositeType(type)) {
          warn(
            "Invalid type: The type `" +
              type +
              "` is used with @populate but does not exist.",
            17
          );
        } else {
          possibleTypes = isAbstractType(type)
            ? schema.getPossibleTypes(type)
            : [type];
        }

        const newSelections = possibleTypes.reduce((p, possibleType) => {
          let typeFrags = activeTypeFragments[possibleType.name];
          const fragmentFields: Record<string, string> = {};

          if (!typeFrags) {
            typeFrags = [];
            const typeFields = possibleType.getFields();
            for (const key in typeFields) {
              const typeField = typeFields[key].type;
              if (
                typeField instanceof GraphQLObjectType &&
                activeTypeFragments[typeField.name]
              ) {
                activeTypeFragments[typeField.name].forEach((fragmentMap) => {
                  fragmentFields[getName(fragmentMap.fragment)] = key;

                  typeFrags.push(fragmentMap);
                });
              }
            }
          }

          for (let i = 0, l = typeFrags.length; i < l; i++) {
            const { fragment } = typeFrags[i];
            const fragmentName = getName(fragment);
            const usedFragments = getUsedFragmentNames(fragment);

            // Add used fragment for insertion at Document node
            for (let j = 0, l = usedFragments.length; j < l; j++) {
              const name = usedFragments[j];
              if (!existingFragmentsForQuery.has(name)) {
                requiredUserFragments[name] = userFragments[name];
              }
            }

            // Add fragment for insertion at Document node
            additionalFragments[fragmentName] = fragment;

            const fragmentSpreadNode = {
              kind: Kind.FRAGMENT_SPREAD,
              name: createNameNode(fragmentName),
            };

            if (fragmentFields[fragmentName]) {
              p.push({
                kind: Kind.FIELD,
                name: createNameNode(fragmentFields[fragmentName]),
                selectionSet: {
                  kind: Kind.SELECTION_SET,
                  selections: [fragmentSpreadNode],
                },
              });
            } else {
              p.push(fragmentSpreadNode);
            }
          }

          return p;
        }, [] as SelectionNode[]);

        const existingSelections = getSelectionSet(node);

        const selections =
          existingSelections.length || newSelections.length
            ? [...newSelections, ...existingSelections]
            : [
                {
                  kind: Kind.FIELD,
                  name: createNameNode("__typename"),
                },
              ];

        return {
          ...node,
          directives,
          selectionSet: {
            kind: Kind.SELECTION_SET,
            selections,
          },
        };
      }
    },
    (node) => {
      if (node.kind === Kind.DOCUMENT) {
        return {
          ...node,
          definitions: [
            ...node.definitions,
            ...Object.keys(additionalFragments).map(
              (key) => additionalFragments[key]
            ),
            ...Object.keys(requiredUserFragments).map(
              (key) => requiredUserFragments[key]
            ),
          ],
        };
      }
    }
  );
};
