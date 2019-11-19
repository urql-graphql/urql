import { pipe, tap, map } from 'wonka';
import { Exchange, Operation } from '../types';
import {
  DocumentNode,
  buildClientSchema,
  visitWithTypeInfo,
  TypeInfo,
  FragmentDefinitionNode,
  SelectionSetNode,
  GraphQLSchema,
  IntrospectionQuery,
} from 'graphql';
import { visit } from 'graphql';

interface ExchangeArgs {
  schema: IntrospectionQuery;
}

/** An exchange for auto-populating mutations with a required response body. */
export const populateExchange = ({
  schema: ogSchema,
}: ExchangeArgs): Exchange => ({ forward }) => {
  const schema = buildClientSchema(ogSchema);
  /** List of operation keys that have already been parsed. */
  let parsedOperations: Record<string, boolean | undefined> = {};
  /** List of operation keys that have not been torn down. */
  let activeOperations: Record<string, boolean | undefined> = {};
  /** Collection of fragments used by the user. */
  let userFragments: UserFragmentMap = {};
  /** Collection of type fragments. */
  let typeFragments: TypeFragmentMap = {};

  /** Handle mutation and inject selections + fragments. */
  const handleIncomingMutation = (op: Operation) => {
    if (op.operationName !== 'mutation') {
      return op;
    }

    const activeSelections = Object.entries(typeFragments).reduce(
      (state, [key, value]) => ({
        ...state,
        [key]: value.filter(s => activeOperations[s.key]),
      }),
      typeFragments
    );

    return {
      ...op,
      query: addFragmentsToQuery({
        schema,
        typeFragments: activeSelections,
        userFragments: userFragments,
        query: op.query,
      }),
    };
  };

  /** Handle query and extract fragments. */
  const handleIncomingQuery = ({ key, operationName, query }: Operation) => {
    activeOperations = addKey(activeOperations, key);

    if (operationName !== 'query' || parsedOperations[key]) {
      return;
    }

    parsedOperations = addKey(parsedOperations, key);

    const {
      fragments: newFragments,
      selections: newSelections,
    } = extractSelectionsFromQuery({
      schema,
      query,
    });

    userFragments = newFragments.reduce(
      (state, fragment) => ({
        ...state,
        [fragment.name.value]: fragment,
      }),
      userFragments
    );

    typeFragments = newSelections.reduce((state, { selections, type }) => {
      const current = state[type] || [];
      const entry: TypeFragment = {
        key,
        fragment: {
          kind: 'FragmentDefinition',
          typeCondition: {
            kind: 'NamedType',
            name: {
              kind: 'Name',
              value: type,
            },
          },
          name: {
            kind: 'Name',
            value: `${type}_PopulateFragment_${current.length}`,
          },
          selectionSet: selections,
        },
        type,
      };
      return {
        ...state,
        [type]: [...current, entry],
      };
    }, typeFragments);
  };

  const handleIncomingTeardown = ({ key, operationName }: Operation) => {
    if (operationName !== 'teardown') {
      return;
    }

    activeOperations = removeKey(activeOperations, key);
  };

  return ops$ => {
    return pipe(
      ops$,
      tap(handleIncomingTeardown),
      tap(handleIncomingQuery),
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
  /** Type of selection. */
  type: string;
}

interface MakeFragmentsFromQueryArg {
  schema: GraphQLSchema;
  query: DocumentNode;
}

/** Creates fragments object from query */
export const extractSelectionsFromQuery = ({
  schema,
  query,
}: MakeFragmentsFromQueryArg) => {
  let selections: { selections: SelectionSetNode; type: string }[] = [];
  let fragments: FragmentDefinitionNode[] = [];
  const typeInfo = new TypeInfo(schema);

  visit(
    query,
    visitWithTypeInfo(typeInfo, {
      Field: node => {
        if (!node.selectionSet) {
          return undefined;
        }

        const type = getType(typeInfo);

        if (!type) {
          return undefined;
        }

        selections = [...selections, { selections: node.selectionSet, type }];
      },
      FragmentDefinition: node => {
        fragments = [...fragments, node];
      },
    })
  );

  return { selections, fragments };
};

interface AddFragmentsToQuery {
  schema: GraphQLSchema;
  query: DocumentNode;
  typeFragments: Record<string, Omit<TypeFragment, 'key'>[]>;
  userFragments: UserFragmentMap;
}

export const addFragmentsToQuery = ({
  schema,
  query,
  typeFragments,
  userFragments,
}: AddFragmentsToQuery) => {
  const typeInfo = new TypeInfo(schema);
  let additionalFragments: Record<string, FragmentDefinitionNode> = {};

  return visit(
    query,
    visitWithTypeInfo(typeInfo, {
      Field: {
        enter: node => {
          if (
            !node.directives ||
            !node.directives.find(d => d.name.value === 'populate')
          ) {
            return;
          }

          const type = getType(typeInfo);
          const directives = node.directives.filter(
            d => d.name.value !== 'populate'
          );
          const existingSelections =
            (node.selectionSet && node.selectionSet.selections) || [];
          const newSelections = (typeFragments[type] || []).map(
            ({ fragment }) => {
              // Add fragment for insertion at Document node
              additionalFragments = {
                ...additionalFragments,
                [fragment.name.value]: fragment,
              };

              return {
                kind: 'FragmentSpread',
                name: {
                  kind: 'Name',
                  value: fragment.name.value,
                },
              };
            }
          );

          return {
            ...node,
            directives,
            selectionSet: {
              kind: 'SelectionSet',
              selections: [...newSelections, ...existingSelections],
            },
          };
        },
      },
      Document: {
        leave: node => {
          return {
            ...node,
            definitions: [
              ...node.definitions,
              ...Object.values(additionalFragments),
              ...Object.values(userFragments),
            ],
          };
        },
      },
    })
  );
};

const addKey = (
  s: Record<string, boolean | undefined>,
  key: number | string
) => ({
  ...s,
  [key]: true,
});

const removeKey = (
  s: Record<string, boolean | undefined>,
  key: number | string
) => ({
  ...s,
  [key]: false,
});

const getType = (t: TypeInfo) => {
  const type = t.getType() as any;
  return type.ofType || type.toString();
};
