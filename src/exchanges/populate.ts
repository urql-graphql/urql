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
} from 'graphql';
import { visit } from 'graphql';

/** An exchange for auto-populating mutations with a required response body. */
export const populateExchange = ({
  schema: ogSchema,
}: ExchangeArgs): Exchange => ({ forward }) => {
  const schema = buildClientSchema(ogSchema);
  let parsedOperations: Record<string, boolean | undefined> = {};
  let activeOperations: Record<string, boolean | undefined> = {};
  let fragments: UserFragmentMap = {};
  let selections: TypeSelectionMap = {};

  /** Handle query and inject selections + fragments. */
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
    if (operationName !== 'query' || parsedOperations[key]) {
      return;
    }

    parsedOperations = addKey(parsedOperations, key);
    activeOperations = addKey(activeOperations, key);

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

    selections = newSelections.reduce((state, { selection, type }) => {
      const entry = {
        key,
        selection,
        type,
      };
      return {
        ...state,
        [type]: state[type] ? [...state[type], entry] : [entry],
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

type TypeSelectionMap<T extends string = string> = Record<
  T,
  UserSelectionSet[]
>;

interface UserSelectionSet {
  /** Operation key where selection set is being used. */
  key: number;
  /** Selection set. */
  selection: SelectionSetNode;
  /** Type of selection. */
  type: string;
}

interface ExchangeArgs {
  schema: any;
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
  let selections: Omit<UserSelectionSet, 'key'>[] = [];
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

        selections = [...selections, { selection: node.selectionSet, type: t }];
      },
      FragmentDefinition: node => {
        fragments = [...fragments, node];
      },
    })
  );

  return { selections, fragments } as const;
};

interface AddFragmentsToQuery {
  schema: GraphQLSchema;
  query: DocumentNode;
  selections: Record<string, Omit<UserSelectionSet, 'key'>[]>;
  fragments: UserFragmentMap;
}

export const addFragmentsToQuery = ({
  schema,
  query,
  selections,
  fragments,
}: AddFragmentsToQuery) => {
  const typeInfo = new TypeInfo(schema);

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
            ? selections[type].map(({ selection }) => ({
                kind: 'InlineFragment',
                typeCondition: {
                  kind: 'NamedType',
                  name: { kind: 'Name', value: type },
                },
                selectionSet: selection,
              }))
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
            definitions: [...node.definitions, ...Object.values(fragments)],
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
