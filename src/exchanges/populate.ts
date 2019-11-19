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
  let fragments: UserFragmentMap = {};
  /** Collection of type fragments. */
  let selections: TypeFragmentMap = {};

  /** Handle mutation and inject selections + fragments. */
  const handleIncomingMutation = (op: Operation) => {
    if (op.operationName !== 'mutation') {
      return op;
    }

    const activeSelections = Object.entries(selections).reduce(
      (state, [key, value]) => ({
        ...state,
        [key]: value.filter(s => activeOperations[s.key]),
      }),
      selections
    );

    return {
      ...op,
      query: addFragmentsToQuery({
        schema,
        selections: activeSelections,
        fragments,
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
    } = makeFragmentsFromQuery({
      schema,
      query,
    });

    fragments = newFragments.reduce(
      (state, fragment) => ({
        ...state,
        [fragment.name.value]: fragment,
      }),
      fragments
    );

    selections = newSelections.reduce((state, { selections, type }) => {
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
    }, selections);
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
export const makeFragmentsFromQuery = ({
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

        // @ts-ignore
        const t = typeInfo.getType().ofType;

        if (!t) {
          return undefined;
        }

        selections = [
          ...selections,
          { selections: node.selectionSet, type: t },
        ];
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
  selections: Record<string, Omit<TypeFragment, 'key'>[]>;
  fragments: UserFragmentMap;
}

export const addFragmentsToQuery = ({
  schema,
  query,
  selections,
  fragments,
}: AddFragmentsToQuery) => {
  const typeInfo = new TypeInfo(schema);
  let additionalFragments: Record<string, FragmentDefinitionNode> = {};

  return visit(
    query,
    visitWithTypeInfo(typeInfo, {
      Field: {
        enter: node => {
          const directive =
            node.directives &&
            node.directives.find(d => d.name.value === 'populate');

          if (!directive) {
            return;
          }

          const t = typeInfo.getType() as any;
          const type = t.ofType || t.toString();

          const existingSelections =
            (node.selectionSet && node.selectionSet.selections) || [];
          const newSelections = selections[type]
            ? selections[type].map(({ fragment }) => {
                // Add fragment for Document node
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
              })
            : [];

          return {
            ...node,
            directives: (node.directives as any).filter(
              d => d.name.value !== 'populate'
            ),
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
              ...Object.values(fragments),
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
