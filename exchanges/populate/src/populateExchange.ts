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
  /** Collection of generated fragments. */
  const newFragments: UserFragmentMap = makeDict();

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
        readFromSelectionSet(t, selections);
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

        if (selection.kind === Kind.INLINE_FRAGMENT) {
          readFromSelectionSet(type, selection.selectionSet.selections);

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
      query: addSelectionsToMutation(
        schema,
        op.query,
        typeFields,
        newFragments
      ),
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

const DOUBLE_COLON = '::';

/** Replaces populate decorator with fragment spreads + fragments. */
export const addSelectionsToMutation = (
  schema: GraphQLSchema,
  query: DocumentNode,
  typeFields: TypeFields,
  newFragments: UserFragmentMap
): DocumentNode => {
  /** Fragments provided and used by the current query */
  const existingFragmentsForQuery: Set<string> = new Set();

  return traverse(
    query,
    node => {
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
          d => getName(d) !== 'populate'
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

        let abstractType: boolean;

        if (!isCompositeType(type)) {
          warn(
            'Invalid type: The type `' +
              type +
              '` is used with @populate but does not exist.',
            17
          );
        } else if (isAbstractType(type)) {
          possibleTypes = schema.getPossibleTypes(type);

          abstractType = true;
        } else {
          possibleTypes = [type];
        }

        const inferFields = (
          selectionMap: SelectionMap,
          fieldValues: FieldValue,
          parent: string
        ) => {
          Object.keys(fieldValues).forEach(fieldKey => {
            const field = fieldValues[fieldKey];

            if (field.type instanceof GraphQLObjectType) {
              const keyName = `${field.fieldName}${DOUBLE_COLON}${field.type.name}`;

              selectionMap.set(
                parent,
                (selectionMap.get(parent) || new Set()).add(keyName)
              );

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
                    keyName
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

        const possibleTypesCount = new Map<string, number>();

        const selectionMap = possibleTypes.reduce((p, possibleType) => {
          typeFields.forEach((value, fieldKey) => {
            if (fieldKey.name === possibleType.name) {
              let parent = '';

              if (abstractType) {
                possibleTypesCount.set(
                  possibleType.name,
                  (possibleTypesCount.get(possibleType.name) || -1) + 1
                );
                parent = `${
                  possibleType.name
                }_PopulateFragment_${possibleTypesCount.get(
                  possibleType.name
                )}`;
              }

              inferFields(p, value, parent);
            } else if (!abstractType) {
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

        const newSelections: Array<SelectionNode> = addSelections(
          selectionMap,
          newFragments
        );

        //if abstract type, add a fragment spread and add the fragment to user fragments
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
    },
    node => {
      if (node.kind === Kind.DOCUMENT) {
        return {
          ...node,
          definitions: [
            ...node.definitions,
            ...Object.keys(newFragments).map(key => newFragments[key]),
          ],
        };
      }
    }
  );
};

const addSelections = (
  selectionMap: SelectionMap,
  newFragments: UserFragmentMap
): Array<SelectionNode> => {
  let newSelections: Array<SelectionNode> = [];

  const addFields = (fieldSet: Set<string>): Array<SelectionNode> => {
    const result: Array<SelectionNode> = [];

    fieldSet.forEach(fieldName => {
      const doubleColonPosition = fieldName.indexOf(DOUBLE_COLON);

      if (doubleColonPosition === -1) {
        result.push({
          kind: Kind.FIELD,
          name: createNameNode(fieldName),
        });
      } else {
        result.push({
          kind: Kind.FIELD,
          name: createNameNode(fieldName.substring(0, doubleColonPosition)),
          selectionSet: {
            kind: Kind.SELECTION_SET,
            selections: addFields(selectionMap.get(fieldName)!),
          },
        });
      }
    });

    return result;
  };

  selectionMap.forEach((fieldSet, key) => {
    if (key === '') {
      newSelections = newSelections.concat(addFields(fieldSet));
    } else if (key.indexOf('_PopulateFragment_') !== -1) {
      const typeName = key.substring(0, key.indexOf('_'));

      newFragments[key] = {
        kind: Kind.FRAGMENT_DEFINITION,
        typeCondition: {
          kind: Kind.NAMED_TYPE,
          name: createNameNode(typeName),
        },
        name: createNameNode(key),
        selectionSet: {
          kind: Kind.SELECTION_SET,
          selections: addFields(fieldSet),
        },
      };

      newSelections.push({
        kind: Kind.FRAGMENT_SPREAD,
        name: createNameNode(key),
      });
    } else if (key.indexOf(DOUBLE_COLON) === -1) {
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
