import { pipe, tap, map } from 'wonka';
import { Exchange, Operation, OperationResult } from '../types';
import {
  DocumentNode,
  print,
  ASTNode,
  buildClientSchema,
  visitWithTypeInfo,
  TypeInfo,
  FragmentDefinitionNode,
} from 'graphql';
import { parse, visit, NonNullTypeNode } from 'graphql';
import { type } from 'os';
import { object } from 'prop-types';
import gql from 'graphql-tag';

type TypeFragmentMap<T extends string = string> = Record<string, string[]> & {
  _fragments?: FragmentDefinitionNode[];
};

interface ExchangeArgs {
  schema: any;
}

/** An exchange for auto-populating mutations with a required response body. */
export const mutateBodyExchange = ({ schema }: ExchangeArgs): Exchange => ({
  forward,
}) => {
  let typeFragments: TypeFragmentMap = { _fragments: [] };

  const handleIncomingMutation = (op: Operation) => {
    if (op.operationName !== 'mutation') {
      return op;
    }

    return;
  };

  const handleIncomingQuery = (op: Operation) => {
    if (op.operationName !== 'query') {
      return;
    }

    typeFragments = makeFragmentsFromQuery({
      schema,
      query: op.query,
      fragmentMap: typeFragments,
    });
  };

  return ops$ => {
    return pipe(
      ops$,
      tap(handleIncomingQuery),
      forward
    );
  };
};

interface MakeFragmentsFromQueryArg {
  schema: any;
  query: DocumentNode;
  fragmentMap: TypeFragmentMap;
}

/** Creates fragments object from query */
export const makeFragmentsFromQuery = ({
  schema,
  query,
  fragmentMap,
}: MakeFragmentsFromQueryArg) => {
  let f = fragmentMap;
  const typeInfo = new TypeInfo(buildClientSchema(schema));

  visit(
    query,
    visitWithTypeInfo(typeInfo, {
      Field: (node, key, parent, path) => {
        if (!node.selectionSet) {
          return undefined;
        }

        // @ts-ignore
        const t = typeInfo.getType().ofType;

        if (!t) {
          return undefined;
        }

        // @ts-ignore
        f = {
          ...f,
          [t]: [...(f[t] || []), node.selectionSet],
        };
      },
      FragmentDefinition: node => {
        // @ts-ignore
        f = {
          ...f,
          _fragments: [...(f._fragments || []), node],
        };
      },
    })
  );

  return f;
};

interface AddFragmentsToQuery {
  schema: any;
  query: DocumentNode;
  fragmentMap: TypeFragmentMap;
}

export const addFragmentsToQuery = ({
  schema,
  query,
  fragmentMap,
}: AddFragmentsToQuery) => {
  const typeInfo = new TypeInfo(buildClientSchema(schema));

  const x = visit(
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

          // @ts-ignore
          const type = typeInfo.getType().ofType;

          return {
            ...node,
            directives: (node.directives as any).filter(
              d => d.name.value !== 'populate'
            ),
            selectionSet: {
              kind: 'SelectionSet',
              selections: fragmentMap[type].map(selectionSet => ({
                kind: 'InlineFragment',
                typeCondition: {
                  kind: 'NamedType',
                  // @ts-ignore
                  name: { kind: 'Name', value: typeInfo.getType().ofType },
                },
                // @ts-ignore
                selectionSet,
              })),
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
              ...(fragmentMap._fragments || []),
            ],
          };
        },
      },
    })
  );

  console.log(print(x));
};
