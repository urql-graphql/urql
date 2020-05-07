import {
  pipe,
  share,
  filter,
  fromPromise,
  takeUntil,
  onEnd,
  mergeMap,
  merge,
} from 'wonka';

import {
  DocumentNode,
  Kind,
  GraphQLSchema,
  GraphQLFieldResolver,
  GraphQLTypeResolver,
  execute,
} from 'graphql';

import { Exchange, makeResult, makeErrorResult, Operation } from '@urql/core';

export const getOperationName = (query: DocumentNode): string | undefined => {
  for (let i = 0, l = query.definitions.length; i < l; i++) {
    const node = query.definitions[i];
    if (node.kind === Kind.OPERATION_DEFINITION && node.name) {
      return node.name.value;
    }
  }
};

interface ExecuteExchangeArgs {
  schema: GraphQLSchema;
  rootValue?: any;
  context?: ((op: Operation) => void) | any;
  fieldResolver?: GraphQLFieldResolver<any, any>;
  typeResolver?: GraphQLTypeResolver<any, any>;
}

/** Exchange for executing queries locally on a schema using graphql-js. */
export const executeExchange = ({
  schema,
  rootValue,
  context,
  fieldResolver,
  typeResolver,
}: ExecuteExchangeArgs): Exchange => ({ forward }) => {
  return ops$ => {
    const sharedOps$ = share(ops$);

    const executedOps$ = pipe(
      sharedOps$,
      filter((operation: Operation) => {
        return (
          operation.operationName === 'query' ||
          operation.operationName === 'mutation'
        );
      }),
      mergeMap((operation: Operation) => {
        const { key } = operation;
        const teardown$ = pipe(
          sharedOps$,
          filter(op => op.operationName === 'teardown' && op.key === key)
        );

        const calculatedContext =
          typeof context === 'function' ? context(operation) : context;

        let ended = false;

        const result = Promise.resolve()
          .then(() => {
            if (ended) return;

            return execute(
              schema,
              operation.query,
              rootValue,
              calculatedContext,
              operation.variables,
              getOperationName(operation.query),
              fieldResolver,
              typeResolver
            );
          })
          .then(result => makeResult(operation, result))
          .catch(err => makeErrorResult(operation, err));

        return pipe(
          fromPromise(result),
          onEnd(() => {
            ended = true;
          }),
          takeUntil(teardown$)
        );
      })
    );

    const forwardedOps$ = pipe(
      sharedOps$,
      filter((operation: Operation) => {
        return (
          operation.operationName !== 'query' &&
          operation.operationName !== 'mutation'
        );
      }),
      forward
    );

    return merge([executedOps$, forwardedOps$]);
  };
};
