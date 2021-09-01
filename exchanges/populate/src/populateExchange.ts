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
  GraphQLObjectType,
  SelectionNode,
  valueFromASTUntyped,
  GraphQLScalarType,
  FieldNode,
} from 'graphql';

import { pipe, tap, map } from 'wonka';
import { Exchange, Operation, stringifyVariables } from '@urql/core';

import { warn } from './helpers/help';
import {
  getName,
  getSelectionSet,
  unwrapType,
  createNameNode,
} from './helpers/node';
import { traverse } from './helpers/traverse';

interface PopulateExchangeOpts {
  schema: IntrospectionQuery;
}

/** @populate stores information per each type it finds */
type TypeKey = GraphQLObjectType | GraphQLInterfaceType;
/** @populate stores all known fields per each type key */
type FieldValue = Record<string, FieldUsage>;
type TypeFields = Map<TypeKey, FieldValue>;
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
export const populateExchange = ({
  schema: ogSchema,
}: PopulateExchangeOpts): Exchange => ({ forward }) => {
  const schema = buildClientSchema(ogSchema);
  /** List of operation keys that have already been parsed. */
  const parsedOperations = new Set<number>();
  /** List of operation keys that have not been torn down. */
  const activeOperations = new Set<number>();
  /** Collection of fragments used by the user. */
  const userFragments: UserFragmentMap = makeDict();

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
      schema.getPossibleTypes(type).forEach(t => {
        readFromSelectionSet(t, selections, seenFields);
      });
    } else {
      const fieldMap = type.getFields();

      let args: null | Record<string, any> = null;
      for (let i = 0; i < selections.length; i++) {
        const selection = selections[i];

        if (selection.kind === Kind.FRAGMENT_SPREAD) {
          const fragmentName = getName(selection);

          const fragment = userFragments[fragmentName];

          if (fragment) {
            readFromSelectionSet(type, fragment.selectionSet.selections);
          }

          continue;
        }

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
    for (let i = node.definitions.length; i--; ) {
      const definition = node.definitions[i];

      if (definition.kind === Kind.FRAGMENT_DEFINITION) {
        userFragments[getName(definition)] = definition;
      } else if (definition.kind === Kind.OPERATION_DEFINITION) {
        const type = schema.getQueryType()!;
        readFromSelectionSet(
          unwrapType(type) as GraphQLObjectType,
          definition.selectionSet.selections!
        );
      }
    }
  };

  /** Handle mutation and inject selections + fragments. */
  const handleIncomingMutation = (op: Operation) => {
    if (op.kind !== 'mutation') {
      return op;
    }

    return {
      ...op,
      query: addSelectionsToMutation(schema, op.query, typeFields),
    };
  };

  /** Handle query and extract fragments. */
  const handleIncomingQuery = ({ key, kind, query, variables }: Operation) => {
    if (kind !== 'query') {
      return;
    }

    activeOperations.add(key);
    if (parsedOperations.has(key)) {
      return;
    }

    parsedOperations.add(key);
    currentVariables = variables || {};

    //do not create fragments from selection set
    //use user fragments and populate typeFields
    //embed this logic in readFromQuery? or extract selection from fragments, then pass it to readFromQuery?
    readFromQuery(query);
  };

  const handleIncomingTeardown = ({ key, kind }: Operation) => {
    if (kind === 'teardown') {
      activeOperations.delete(key);
    }
  };

  return ops$ => {
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

type SelectionMap = Map<string, Set<string>>;

/** Replaces populate decorator with fragment spreads + fragments. */
export const addSelectionsToMutation = (
  schema: GraphQLSchema,
  query: DocumentNode,
  typeFields: TypeFields
): DocumentNode => {
  /** Fragments provided and used by the current query */
  const existingFragmentsForQuery: Set<string> = new Set();

  return traverse(query, node => {
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

      const directives = node.directives.filter(d => getName(d) !== 'populate');

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
          'Invalid type: The type `' +
            type +
            '` is used with @populate but does not exist.',
          17
        );
      } else {
        possibleTypes = isAbstractType(type)
          ? schema.getPossibleTypes(type)
          : [type];
      }

      const inferFields = (
        selectionMap: SelectionMap,
        fieldValues: FieldValue,
        parent: string
      ) => {
        Object.keys(fieldValues).forEach(fieldKey => {
          const field = fieldValues[fieldKey];

          if (field.type instanceof GraphQLObjectType) {
            typeFields.forEach((value, fieldKey) => {
              if (fieldKey.name === field.type.name) {
                inferFields(
                  selectionMap,
                  Object.keys(value).reduce((prev, currentKey) => {
                    if (value[currentKey].type instanceof GraphQLScalarType) {
                      return {
                        ...prev,
                        [currentKey]: value[currentKey],
                      };
                    }

                    return prev;
                  }, {}),
                  field.fieldName
                );
              }
            });
          } else {
            selectionMap.set(
              parent,
              (selectionMap.get(parent) || new Set()).add(field.fieldName)
            );
          }
        });
      };

      const selectionMap = possibleTypes.reduce((p, possibleType) => {
        typeFields.forEach((value, fieldKey) => {
          if (fieldKey.name === possibleType.name) {
            inferFields(p, value, '');
          } else {
            const possibleTypeFields = possibleType.getFields();
            for (const ptKey in possibleTypeFields) {
              const typeField = possibleTypeFields[ptKey].type;
              if (
                typeField instanceof GraphQLObjectType &&
                fieldKey.name === typeField.name
              ) {
                inferFields(p, value, ptKey);
              }
            }
          }
        });

        return p;
      }, new Map() as SelectionMap);

      const newSelections: Array<FieldNode> = addSelections(selectionMap);

      const existingSelections = getSelectionSet(node);

      const selections =
        existingSelections.length || newSelections.length
          ? [...newSelections, ...existingSelections]
          : [
              {
                kind: Kind.FIELD,
                name: createNameNode('__typename'),
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
  });
};

const addSelections = (selectionMap: SelectionMap): Array<FieldNode> => {
  let newSelections: Array<FieldNode> = [];

  const addFields = (fieldSet: Set<string>): Array<FieldNode> => {
    const result: Array<FieldNode> = [];

    fieldSet.forEach(fieldName => {
      result.push({
        kind: Kind.FIELD,
        name: createNameNode(fieldName),
      });
    });

    return result;
  };

  selectionMap.forEach((fieldSet, key) => {
    if (key === '') {
      newSelections = newSelections.concat(addFields(fieldSet));
    } else {
      newSelections.push({
        kind: Kind.FIELD,
        name: createNameNode(key),
        selectionSet: {
          kind: Kind.SELECTION_SET,
          selections: addFields(fieldSet),
        },
      });
    }
  });

  return newSelections;
};
