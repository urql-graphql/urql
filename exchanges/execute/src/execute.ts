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
  subscribe,
  ExecutionArgs,
  SubscriptionArgs,
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
  context?: ((op: Operation) => any) | any;
  fieldResolver?: GraphQLFieldResolver<any, any>;
  typeResolver?: GraphQLTypeResolver<any, any>;
  subscribeFieldResolver?: GraphQLFieldResolver<any, any>;
}

type ExecuteParams = ExecutionArgs | SubscriptionArgs;

const asyncIterator =
  typeof Symbol !== 'undefined' ? Symbol.asyncIterator : null;

const makeExecuteSource = (
  operation: Operation,
  args: ExecuteParams
): Source<OperationResult> => {
  return make<OperationResult>(observer => {
    let iterator: AsyncIterator<ExecutionResult>;
    let ended = false;

    Promise.resolve()
      .then(() => {
        if (ended) return;
        if (operation.kind === 'subscription') {
          return subscribe(args) as any;
        }
        return execute(args) as any;
      })
      .then((result: ExecutionResult | AsyncIterable<ExecutionResult>) => {
        if (ended || !result) {
          return;
        } else if (!asyncIterator || !result[asyncIterator]) {
          observer.next(makeResult(operation, result as ExecutionResult));
          return;
        }
        iterator = result[asyncIterator!]();
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
      if (iterator && iterator.return) iterator.return();
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
  subscribeFieldResolver,
}: ExecuteExchangeArgs): Exchange => ({ forward }) => {
  return ops$ => {
    const sharedOps$ = share(ops$);

    const executedOps$ = pipe(
      sharedOps$,
      filter((operation: Operation) => {
        return (
          operation.kind === 'query' ||
          operation.kind === 'mutation' ||
          operation.kind === 'subscription'
        );
      }),
      mergeMap((operation: Operation) => {
        const { key } = operation;
        const teardown$ = pipe(
          sharedOps$,
          filter(op => op.kind === 'teardown' && op.key === key)
        );

        const contextValue =
          typeof context === 'function' ? context(operation) : context;

        // Filter undefined values from variables before calling execute()
        // to support default values within directives.
        const variableValues = Object.create(null);
        if (operation.variables) {
          for (const key in operation.variables) {
            if (operation.variables[key] !== undefined) {
              variableValues[key] = operation.variables[key];
            }
          }
        }

        return pipe(
          makeExecuteSource(operation, {
            schema,
            document: operation.query,
            rootValue,
            contextValue,
            variableValues,
            operationName: getOperationName(operation.query),
            fieldResolver,
            typeResolver,
            subscribeFieldResolver,
          }),
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
