import {
  buildClientSchema,
  FragmentDefinitionNode,
  IntrospectionQuery,
  isAbstractType,
  Kind,
  GraphQLObjectType,
  SelectionNode,
  GraphQLInterfaceType,
  valueFromASTUntyped,
  GraphQLScalarType,
  FieldNode,
  InlineFragmentNode,
  FragmentSpreadNode,
  ArgumentNode,
} from 'graphql';
import { pipe, tap, map } from 'wonka';
import { Exchange, Operation, stringifyVariables } from '@urql/core';

import { getName, GraphQLFlatType, unwrapType } from './helpers/node';
import { traverse } from './helpers/traverse';

/** Configuration options for the {@link populateExchange}'s behaviour */
export interface Options {
  /** Prevents populating fields for matching types.
   *
   * @remarks
   * `skipType` may be set to a regular expression that, when matching,
   * prevents fields to be added automatically for the given type by the
   * `populateExchange`.
   *
   * @defaultValue `/^PageInfo|(Connection|Edge)$/` - Omit Relay pagination fields
   */
  skipType?: RegExp;
  /** Specifies a maximum depth for populated fields.
   *
   * @remarks
   * `maxDepth` may be set to a maximum depth at which fields are populated.
   * This may prevent the `populateExchange` from adding infinitely deep
   * recursive fields or simply too many fields.
   *
   * @defaultValue `2` - Omit fields past a depth of 2.
   */
  maxDepth?: number;
}

/** Input parameters for the {@link populateExchange}. */
export interface PopulateExchangeOpts {
  /** Introspection data for an API’s schema.
   *
   * @remarks
   * `schema` must be passed Schema Introspection data for the GraphQL API
   * this exchange is applied for.
   * You may use the `@urql/introspection` package to generate this data.
   *
   * @see {@link https://spec.graphql.org/October2021/#sec-Schema-Introspection} for the Schema Introspection spec.
   */
  schema: IntrospectionQuery;
  /** Configuration options for the {@link populateExchange}'s behaviour */
  options?: Options;
}

const makeDict = (): any => Object.create(null);

/** stores information per each type it finds */
type TypeKey = GraphQLObjectType | GraphQLInterfaceType;
/** stores all known fields per each type key */
type FieldValue = Record<string, FieldUsage>;
type TypeFields = Map<String, FieldValue>;
/** Describes information about a given field, i.e. type (owner), arguments, how many operations use this field */
interface FieldUsage {
  type: TypeKey;
  args: null | { [key: string]: { value: any; kind: any } };
  fieldName: string;
}

type FragmentMap<T extends string = string> = Record<T, FragmentDefinitionNode>;
const SKIP_COUNT_TYPE = /^PageInfo|(Connection|Edge)$/;

/** Creates an `Exchange` handing automatic mutation selection-set population based on the
 * query selection-sets seen.
 *
 * @param options - A {@link PopulateExchangeOpts} configuration object.
 * @returns the created populate {@link Exchange}.
 *
 * @remarks
 * The `populateExchange` will create an exchange that monitors queries and
 * extracts fields and types so it knows what is currently observed by your
 * application.
 * When a mutation comes in with the `@populate` directive it will fill the
 * selection-set based on these prior queries.
 *
 * This Exchange can ease up the transition from documentCache to graphCache
 *
 * @example
 * ```ts
 * populateExchange({
 *   schema,
 *   options: {
 *     maxDepth: 3,
 *     skipType: /Todo/
 *   },
 * });
 *
 * const query = gql`
 *   mutation { addTodo @popualte }
 * `;
 * ```
 */
export const populateExchange =
  ({ schema: ogSchema, options }: PopulateExchangeOpts): Exchange =>
  ({ forward }) => {
    const maxDepth = (options && options.maxDepth) || 2;
    const skipType = (options && options.skipType) || SKIP_COUNT_TYPE;

    const schema = buildClientSchema(ogSchema);
    /** List of operation keys that have already been parsed. */
    const parsedOperations = new Set<number>();
    /** List of operation keys that have not been torn down. */
    const activeOperations = new Set<number>();
    /** Collection of fragments used by the user. */
    const userFragments: FragmentMap = makeDict();

    // State of the global types & their fields
    const typeFields: TypeFields = new Map();
    let currentVariables: object = {};

    /** Handle mutation and inject selections + fragments. */
    const handleIncomingMutation = (op: Operation) => {
      if (op.kind !== 'mutation') {
        return op;
      }

      const document = traverse(op.query, node => {
        if (node.kind === Kind.FIELD) {
          if (!node.directives) return;

          const directives = node.directives.filter(
            d => getName(d) !== 'populate'
          );

          if (directives.length === node.directives.length) return;

          const field = schema.getMutationType()!.getFields()[node.name.value];

          if (!field) return;

          const type = unwrapType(field.type);

          if (!type) {
            return {
              ...node,
              selectionSet: {
                kind: Kind.SELECTION_SET,
                selections: [
                  {
                    kind: Kind.FIELD,
                    name: {
                      kind: Kind.NAME,
                      value: '__typename',
                    },
                  },
                ],
              },
              directives,
            };
          }

          const visited = new Set();
          const populateSelections = (
            type: GraphQLFlatType,
            selections: Array<
              FieldNode | InlineFragmentNode | FragmentSpreadNode
            >,
            depth: number
          ) => {
            let possibleTypes: readonly string[] = [];
            let isAbstract = false;
            if (isAbstractType(type)) {
              isAbstract = true;
              possibleTypes = schema.getPossibleTypes(type).map(x => x.name);
            } else {
              possibleTypes = [type.name];
            }

            possibleTypes.forEach(typeName => {
              const fieldsForType = typeFields.get(typeName);
              if (!fieldsForType) {
                if (possibleTypes.length === 1) {
                  selections.push({
                    kind: Kind.FIELD,
                    name: {
                      kind: Kind.NAME,
                      value: '__typename',
                    },
                  });
                }
                return;
              }

              let typeSelections: Array<
                FieldNode | InlineFragmentNode | FragmentSpreadNode
              > = selections;

              if (isAbstract) {
                typeSelections = [
                  {
                    kind: Kind.FIELD,
                    name: {
                      kind: Kind.NAME,
                      value: '__typename',
                    },
                  },
                ];
                selections.push({
                  kind: Kind.INLINE_FRAGMENT,
                  typeCondition: {
                    kind: Kind.NAMED_TYPE,
                    name: {
                      kind: Kind.NAME,
                      value: typeName,
                    },
                  },
                  selectionSet: {
                    kind: Kind.SELECTION_SET,
                    selections: typeSelections,
                  },
                });
              } else {
                typeSelections.push({
                  kind: Kind.FIELD,
                  name: {
                    kind: Kind.NAME,
                    value: '__typename',
                  },
                });
              }

              Object.keys(fieldsForType).forEach(key => {
                const value = fieldsForType[key];
                if (value.type instanceof GraphQLScalarType) {
                  const args = value.args
                    ? Object.keys(value.args).map(k => {
                        const v = value.args![k];
                        return {
                          kind: Kind.ARGUMENT,
                          value: {
                            kind: v.kind,
                            value: v.value,
                          },
                          name: {
                            kind: Kind.NAME,
                            value: k,
                          },
                        } as ArgumentNode;
                      })
                    : [];
                  const field: FieldNode = {
                    kind: Kind.FIELD,
                    arguments: args,
                    name: {
                      kind: Kind.NAME,
                      value: value.fieldName,
                    },
                  };

                  typeSelections.push(field);
                } else if (
                  value.type instanceof GraphQLObjectType &&
                  !visited.has(value.type.name) &&
                  depth < maxDepth
                ) {
                  visited.add(value.type.name);
                  const fieldSelections: Array<FieldNode> = [];

                  populateSelections(
                    value.type,
                    fieldSelections,
                    skipType.test(value.type.name) ? depth : depth + 1
                  );

                  const args = value.args
                    ? Object.keys(value.args).map(k => {
                        const v = value.args![k];
                        return {
                          kind: Kind.ARGUMENT,
                          value: {
                            kind: v.kind,
                            value: v.value,
                          },
                          name: {
                            kind: Kind.NAME,
                            value: k,
                          },
                        } as ArgumentNode;
                      })
                    : [];

                  const field: FieldNode = {
                    kind: Kind.FIELD,
                    selectionSet: {
                      kind: Kind.SELECTION_SET,
                      selections: fieldSelections,
                    },
                    arguments: args,
                    name: {
                      kind: Kind.NAME,
                      value: value.fieldName,
                    },
                  };

                  typeSelections.push(field);
                }
              });
            });
          };

          visited.add(type.name);
          const selections: Array<
            FieldNode | InlineFragmentNode | FragmentSpreadNode
          > = node.selectionSet ? [...node.selectionSet.selections] : [];
          populateSelections(type, selections, 0);

          return {
            ...node,
            selectionSet: {
              kind: Kind.SELECTION_SET,
              selections,
            },
            directives,
          };
        }
      });

      return {
        ...op,
        query: document,
      };
    };

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

          let fields = typeFields.get(ownerType.name);
          if (!fields) typeFields.set(type.name, (fields = {}));

          const childType = unwrapType(
            fieldMap[fieldName].type
          ) as GraphQLObjectType;

          if (selection.arguments && selection.arguments.length) {
            args = {};
            for (let j = 0; j < selection.arguments.length; j++) {
              const argNode = selection.arguments[j];
              args[argNode.name.value] = {
                value: valueFromASTUntyped(
                  argNode.value,
                  currentVariables as any
                ),
                kind: argNode.value.kind,
              };
            }
          }

          const fieldKey = args
            ? `${fieldName}:${stringifyVariables(args)}`
            : fieldName;

          if (!fields[fieldKey]) {
            fields[fieldKey] = {
              type: childType,
              args,
              fieldName,
            };
          }

          if (selection.selectionSet) {
            readFromSelectionSet(childType, selection.selectionSet.selections);
          }
        }
      }
    };

    /** Handle query and extract fragments. */
    const handleIncomingQuery = ({
      key,
      kind,
      query,
      variables,
    }: Operation) => {
      if (kind !== 'query') {
        return;
      }

      activeOperations.add(key);
      if (parsedOperations.has(key)) {
        return;
      }

      parsedOperations.add(key);
      currentVariables = variables || {};

      for (let i = query.definitions.length; i--; ) {
        const definition = query.definitions[i];

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

    const handleIncomingTeardown = ({ key, kind }: Operation) => {
      // TODO: we might want to remove fields here, the risk becomes
      // that data in the cache would become stale potentially
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
