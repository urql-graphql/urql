import { pipe, tap, map } from 'wonka';
import { Exchange, Operation } from '../types';
import {
  DocumentNode,
  buildClientSchema,
  visitWithTypeInfo,
  TypeInfo,
  FragmentDefinitionNode,
  SelectionSetNode,
} from 'graphql';
import { visit } from 'graphql';

/** An exchange for auto-populating mutations with a required response body. */
export const populateExchange = ({ schema }: ExchangeArgs): Exchange => ({
  forward,
}) => {
  let parsedKeys: Record<string, boolean | undefined> = {};
  let fragments: UserFragmentMap = {};
  let selections: TypeSelectionMap = {};

  const handleIncomingMutation = (op: Operation) => {
    if (op.operationName !== 'mutation') {
      return op;
    }

    return {
      ...op,
      query: addFragmentsToQuery({
        schema,
        selections,
        fragments,
        query: op.query,
      }),
    };
  };

  const handleIncomingQuery = ({ key, operationName, query }: Operation) => {
    if (operationName !== 'query' || parsedKeys[key]) {
      return;
    }

    parsedKeys = {
      ...parsedKeys,
      [key]: true,
    };

    const {
      fragments: newFragments,
      selections: newSelections,
    } = makeFragmentsFromQuery({ schema, query });

    fragments = newFragments.reduce(
      (state, fragment) => ({ ...state, [fragment.name.value]: fragment }),
      fragments
    );

    selections = newSelections.reduce((state, { selection, type }) => {
      const entry = { key, selection, type };
      return {
        ...state,
        [type]: state[type] ? [...state[type], entry] : [entry],
      };
    }, selections);
  };

  return ops$ => {
    return pipe(
      ops$,
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
  schema: any;
  query: DocumentNode;
}

/** Creates fragments object from query */
export const makeFragmentsFromQuery = ({
  schema,
  query,
}: MakeFragmentsFromQueryArg) => {
  let selections: Omit<UserSelectionSet, 'key'>[] = [];
  let fragments: FragmentDefinitionNode[] = [];

  const typeInfo = new TypeInfo(buildClientSchema(schema));

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
  schema: any;
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
  const typeInfo = new TypeInfo(buildClientSchema(schema));

  const v = visit(
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

  return v;
};
