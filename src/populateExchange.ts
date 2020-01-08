import {
  DocumentNode,
  buildClientSchema,
  visitWithTypeInfo,
  TypeInfo,
  FragmentDefinitionNode,
  GraphQLSchema,
  IntrospectionQuery,
  FragmentSpreadNode,
  NameNode,
  ASTNode,
  isCompositeType,
  isAbstractType,
  Kind,
  visit,
} from 'graphql';

import { pipe, tap, map } from 'wonka';
import { Exchange, Operation } from 'urql/core';

import { getName, getSelectionSet, unwrapType } from './ast';
import { makeDict } from './store';
import { invariant, warn } from './helpers/help';

interface PopulateExchangeOpts {
  schema: IntrospectionQuery;
}

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
  const typeInfo = new TypeInfo(schema);

  visit(
    query,
    visitWithTypeInfo(typeInfo, {
      Field: node => {
        if (node.selectionSet) {
          const type = getTypeName(typeInfo);
          newFragments.push({
            kind: Kind.FRAGMENT_DEFINITION,
            typeCondition: {
              kind: Kind.NAMED_TYPE,
              name: nameNode(type),
            },
            name: nameNode(`${type}_PopulateFragment_`),
            selectionSet: node.selectionSet,
          });
        }
      },
      FragmentDefinition: node => {
        extractedFragments.push(node);
      },
    })
  );

  return [extractedFragments, newFragments];
};

/** Replaces populate decorator with fragment spreads + fragments. */
export const addFragmentsToQuery = (
  schema: GraphQLSchema,
  query: DocumentNode,
  activeTypeFragments: TypeFragmentMap,
  userFragments: UserFragmentMap
) => {
  const typeInfo = new TypeInfo(schema);

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

  return visit(
    query,
    visitWithTypeInfo(typeInfo, {
      Field: {
        enter: node => {
          if (!node.directives) {
            return;
          }

          const directives = node.directives.filter(
            d => getName(d) !== 'populate'
          );
          if (directives.length === node.directives.length) {
            return;
          }

          const possibleTypes = getTypes(schema, typeInfo);
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
            existingSelections.length + newSelections.length !== 0
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
      },
      Document: {
        enter: node => {
          node.definitions.reduce((set, definition) => {
            if (definition.kind === 'FragmentDefinition') {
              set.add(definition.name.value);
            }
            return set;
          }, existingFragmentsForQuery);
        },
        leave: node => {
          const definitions = [...node.definitions];
          for (const key in additionalFragments)
            definitions.push(additionalFragments[key]);
          for (const key in requiredUserFragments)
            definitions.push(requiredUserFragments[key]);
          return { ...node, definitions };
        },
      },
    })
  );
};

const nameNode = (value: string): NameNode => ({
  kind: Kind.NAME,
  value,
});

/** Get all possible types for node with TypeInfo. */
const getTypes = (schema: GraphQLSchema, typeInfo: TypeInfo) => {
  const type = unwrapType(typeInfo.getType());
  if (!isCompositeType(type)) {
    warn(
      'Invalid type: The type ` + type + ` is used with @populate but does not exist.',
      17
    );
    return [];
  }

  return isAbstractType(type) ? schema.getPossibleTypes(type) : [type];
};

/** Get name of non-abstract type for adding to 'activeTypeFragments'. */
const getTypeName = (typeInfo: TypeInfo) => {
  const type = unwrapType(typeInfo.getType());
  invariant(
    type && !isAbstractType(type),
    'Invalid TypeInfo state: Found no flat schema type when one was expected.',
    18
  );

  return type.toString();
};

/** Get fragment names referenced by node. */
const getUsedFragments = (node: ASTNode) => {
  const names: string[] = [];

  visit(node, {
    FragmentSpread: f => {
      names.push(getName(f));
    },
  });

  return names;
};
