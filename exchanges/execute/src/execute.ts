import {
  Source,
  pipe,
  share,
  filter,
  takeUntil,
  mergeMap,
  merge,
  make,
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
  mergeResultPatch,
  Operation,
  OperationResult,
  getOperationName,
} from '@urql/core';

export interface ExecuteExchangeArgs {
  schema: GraphQLSchema;
  rootValue?: any;
  context?: ((op: Operation) => void) | any;
  fieldResolver?: GraphQLFieldResolver<any, any>;
  typeResolver?: GraphQLTypeResolver<any, any>;
}

type ExecuteParams = Parameters<typeof execute>;

const asyncIterator =
  typeof Symbol !== 'undefined' ? Symbol.asyncIterator : null;

const makeExecuteSource = (
  operation: Operation,
  args: ExecuteParams
): Source<OperationResult> => {
  return make<OperationResult>(observer => {
    let ended = false;

    Promise.resolve()
      .then(() => {
        if (ended) return;
        return execute(...args) as any;
      })
      .then((result: ExecutionResult | AsyncIterable<ExecutionResult>) => {
        if (ended || !result) {
          return;
        } else if (!asyncIterator || !result[asyncIterator]) {
          observer.next(makeResult(operation, result as ExecutionResult));
          return;
        }

        const iterator: AsyncIterator<ExecutionResult> = result[
          asyncIterator!
        ]();
        let prevResult: OperationResult | null = null;

        function next({
          done,
          value,
        }: {
          done?: boolean;
          value: ExecutionResult;
        }) {
          if (value) {
            observer.next(
              (prevResult = prevResult
                ? mergeResultPatch(prevResult, value)
                : makeResult(operation, value))
            );
          }

          if (!done && !ended) {
            return iterator.next().then(next);
          }
        }

        return iterator.next().then(next);
      })
      .then(() => {
        observer.complete();
      })
      .catch(error => {
        observer.next(makeErrorResult(operation, error));
        observer.complete();
      });

    return () => {
      ended = true;
    };
  });
};

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
        return pipe(
          makeExecuteSource(operation, [
            schema,
            operation.query,
            rootValue,
            calculatedContext,
            operation.variables,
            getOperationName(operation.query),
            fieldResolver,
            typeResolver,
          ]),
          takeUntil(teardown$)
        );
      })
    );

    const forwardedOps$ = pipe(
      sharedOps$,
      filter(operation => operation.kind === 'teardown'),
      forward
    );

    return merge([executedOps$, forwardedOps$]);
  };
};
