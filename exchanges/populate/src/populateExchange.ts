import {
  DocumentNode,
  buildClientSchema,
  FragmentDefinitionNode,
  GraphQLSchema,
  IntrospectionQuery,
  FragmentSpreadNode,
  NameNode,
  isCompositeType,
  isAbstractType,
  Kind,
  visit,
  SelectionSetNode,
  GraphQLObjectType,
  SelectionNode,
  GraphQLFieldMap,
} from 'graphql';
import { getName, getSelectionSet, unwrapType } from './helpers/node';
import { warn } from './helpers/help';

import { pipe, tap, map } from 'wonka';
import { Exchange, Operation } from '@urql/core';

interface PopulateExchangeOpts {
  schema: IntrospectionQuery;
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
  /** Collection of actively in use type fragments. */
  const activeTypeFragments: TypeFragmentMap = makeDict();

  /** Handle mutation and inject selections + fragments. */
  const handleIncomingMutation = (op: Operation) => {
    if (op.operationName !== 'mutation') {
      return op;
    }

    const activeSelections: TypeFragmentMap = makeDict();
    for (const name in activeTypeFragments) {
      activeSelections[name] = activeTypeFragments[name].filter(s =>
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
  const handleIncomingQuery = ({ key, operationName, query }: Operation) => {
    if (operationName !== 'query') {
      return;
    }

    activeOperations.add(key);
    if (parsedOperations.has(key)) {
      return;
    }

    parsedOperations.add(key);

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

  const handleIncomingTeardown = ({ key, operationName }: Operation) => {
    if (operationName === 'teardown') {
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

    selectionSet.selections.forEach(selection => {
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

  visit(query, {
    Field: {
      enter: node => {
        if (node.selectionSet) {
          const type = unwrapType(
            resolvePosition(schema, visits)[node.name.value].type
          );
          visits.push(node.name.value);

          if (isAbstractType(type)) {
            const types = schema.getPossibleTypes(type);
            types.forEach(t => {
              newFragments.push({
                kind: Kind.FRAGMENT_DEFINITION,
                typeCondition: {
                  kind: Kind.NAMED_TYPE,
                  name: nameNode(t.toString()),
                },
                name: nameNode(`${t.toString()}_PopulateFragment_`),
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
                name: nameNode(type.toString()),
              },
              name: nameNode(`${type.toString()}_PopulateFragment_`),
              selectionSet: node.selectionSet,
            });
          }
        }
      },
      leave: node => {
        if (node.selectionSet) visits.pop();
      },
    },
    FragmentDefinition: node => {
      extractedFragments.push(node);
    },
  });

  return [extractedFragments, newFragments];
};

/** Replaces populate decorator with fragment spreads + fragments. */
export const addFragmentsToQuery = (
  schema: GraphQLSchema,
  query: DocumentNode,
  activeTypeFragments: TypeFragmentMap,
  userFragments: UserFragmentMap
) => {
  const requiredUserFragments: Record<
    string,
    FragmentDefinitionNode
  > = makeDict();

  const additionalFragments: Record<
    string,
    FragmentDefinitionNode
  > = makeDict();

  /** Fragments provided and used by the current query */
  const existingFragmentsForQuery: Set<string> = new Set();

  return visit(query, {
    Field: node => {
      if (!node.directives) {
        return;
      }

      const directives = node.directives.filter(d => getName(d) !== 'populate');
      if (directives.length === node.directives.length) {
        return;
      }

      const type = unwrapType(
        schema.getMutationType()!.getFields()[node.name.value].type
      );

      let possibleTypes: readonly GraphQLObjectType<any, any>[] = [];
      if (!isCompositeType(type)) {
        warn(
          'Invalid type: The type ` + type + ` is used with @populate but does not exist.',
          17
        );
      } else {
        possibleTypes = isAbstractType(type)
          ? schema.getPossibleTypes(type)
          : [type];
      }

      const newSelections = possibleTypes.reduce((p, possibleType) => {
        const typeFrags = activeTypeFragments[possibleType.name];
        if (!typeFrags) {
          return p;
        }

        for (let i = 0, l = typeFrags.length; i < l; i++) {
          const { fragment } = typeFrags[i];
          const fragmentName = getName(fragment);
          const usedFragments = getUsedFragments(fragment);

          // Add used fragment for insertion at Document node
          for (let j = 0, l = usedFragments.length; j < l; j++) {
            const name = usedFragments[j];
            if (!existingFragmentsForQuery.has(name)) {
              requiredUserFragments[name] = userFragments[name];
            }
          }

          // Add fragment for insertion at Document node
          additionalFragments[fragmentName] = fragment;

          p.push({
            kind: Kind.FRAGMENT_SPREAD,
            name: nameNode(fragmentName),
          });
        }

        return p;
      }, [] as FragmentSpreadNode[]);

      const existingSelections = getSelectionSet(node);

      const selections =
        existingSelections.length || newSelections.length
          ? [...newSelections, ...existingSelections]
          : [
              {
                kind: Kind.FIELD,
                name: nameNode('__typename'),
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
    },
    Document: {
      enter: node => {
        node.definitions.reduce((set, definition) => {
          if (definition.kind === Kind.FRAGMENT_DEFINITION) {
            set.add(definition.name.value);
          }

          return set;
        }, existingFragmentsForQuery);
      },
      leave: node => ({
        ...node,
        definitions: [
          ...node.definitions,
          ...Object.values(additionalFragments),
          ...Object.values(requiredUserFragments),
        ],
      }),
    },
  });
};

const nameNode = (value: string): NameNode => ({
  kind: Kind.NAME,
  value,
});

/** Get fragment names referenced by node. */
const getUsedFragments = (node: FragmentDefinitionNode) => {
  const names: string[] = [];

  traverse(node, n => {
    if (n.kind === Kind.FRAGMENT_SPREAD) {
      names.push(getName(n as FragmentSpreadNode));
    }
  });

  return names;
};

const traverse = (
  node: any,
  enter?: (n: SelectionNode) => void,
  exit?: (n: SelectionNode) => void
) => {
  if (node.selectionSet) {
    node.selectionSet.selections.forEach(n => {
      if (enter) enter(n);
      traverse(n, enter, exit);
      if (exit) exit(n);
    });
  }
};

const resolvePosition = (
  schema: GraphQLSchema,
  visits: string[]
): GraphQLFieldMap<any, any> => {
  let currentFields = schema.getQueryType()!.getFields();

  for (let i = 0; i < visits.length; i++) {
    const t = unwrapType(currentFields[visits[i]].type);

    if (isAbstractType(t)) {
      currentFields = {};
      schema.getPossibleTypes(t).forEach(implementedType => {
        currentFields = {
          ...currentFields,
          // @ts-ignore TODO: proper casting
          ...schema.getType(implementedType.name)!.toConfig().fields,
        };
      });
    } else {
      // @ts-ignore TODO: proper casting
      currentFields = schema.getType(t!.name)!.toConfig().fields;
    }
  }

  return currentFields;
};
