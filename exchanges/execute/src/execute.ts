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
  GraphQLSchema,
  GraphQLFieldResolver,
  GraphQLTypeResolver,
  execute,
} from 'graphql';

import {
  Exchange,
  ExecutionResult,
  makeResult,
  makeErrorResult,
  Operation,
  getOperationName,
} from '@urql/core';

export interface ExecuteExchangeArgs {
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
        return operation.kind === 'query' || operation.kind === 'mutation';
      }),
      mergeMap((operation: Operation) => {
        const { key } = operation;
        const teardown$ = pipe(
          sharedOps$,
          filter(op => op.kind === 'teardown' && op.key === key)
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
          .then(result => makeResult(operation, result as ExecutionResult))
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
        return operation.kind !== 'query' && operation.kind !== 'mutation';
      }),
      forward
    );

    return merge([executedOps$, forwardedOps$]);
  };
};
