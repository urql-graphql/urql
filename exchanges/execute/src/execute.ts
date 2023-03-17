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
  Kind,
} from 'graphql';

import {
  Exchange,
  ExecutionResult,
  makeResult,
  makeErrorResult,
  mergeResultPatch,
  Operation,
  OperationResult,
} from '@urql/core';

/** Input parameters for the {@link executeExchange}.
 * @see {@link ExecutionArgs} which this interface mirrors. */
export interface ExecuteExchangeArgs {
  /** GraphQL Schema definition that `Operation`s are execute against. */
  schema: GraphQLSchema;
  /** Context object or a factory function creating a `context` object.
   *
   * @remarks
   * The `context` that is passed to the `schema` may either be passed
   * or created from an incoming `Operation`, which also allows it to
   * be recreated per `Operation`.
   */
  context?: ((operation: Operation) => any) | any;
  rootValue?: any;
  fieldResolver?: GraphQLFieldResolver<any, any>;
  typeResolver?: GraphQLTypeResolver<any, any>;
  subscribeFieldResolver?: GraphQLFieldResolver<any, any>;
}

type ExecuteParams = ExecutionArgs | SubscriptionArgs;

const asyncIterator =
  typeof Symbol !== 'undefined' ? Symbol.asyncIterator : null;

const makeExecuteSource = (
  operation: Operation,
  _args: ExecuteParams
): Source<OperationResult> => {
  return make<OperationResult>(observer => {
    let iterator: AsyncIterator<ExecutionResult>;
    let ended = false;

    Promise.resolve()
      .then(async () => ({ ..._args, contextValue: await _args.contextValue }))
      .then(args => {
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

/** Exchange factory that executes operations against a GraphQL schema.
 *
 * @param options - A {@link ExecuteExchangeArgs} configuration object.
 * @returns the created execute {@link Exchange}.
 *
 * @remarks
 * The `executeExchange` executes GraphQL operations against the `schema`
 * that it’s passed. As such, its options mirror the options that GraphQL.js’
 * {@link execute} function accepts.
 */
export const executeExchange =
  (options: ExecuteExchangeArgs): Exchange =>
  ({ forward }) => {
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
            typeof options.context === 'function'
              ? options.context(operation)
              : options.context;

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

          let operationName: string | undefined;
          for (const node of operation.query.definitions) {
            if (node.kind === Kind.OPERATION_DEFINITION) {
              operationName = node.name ? node.name.value : undefined;
              break;
            }
          }

          return pipe(
            makeExecuteSource(operation, {
              schema: options.schema,
              document: operation.query,
              rootValue: options.rootValue,
              contextValue,
              variableValues,
              operationName,
              fieldResolver: options.fieldResolver,
              typeResolver: options.typeResolver,
              subscribeFieldResolver: options.subscribeFieldResolver,
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
