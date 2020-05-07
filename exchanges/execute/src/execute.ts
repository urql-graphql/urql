import { pipe, share, filter, map, fromPromise, mergeMap, merge } from 'wonka';
import {
  GraphQLSchema,
  GraphQLFieldResolver,
  GraphQLTypeResolver,
  execute,
} from 'graphql';
import { Exchange, makeResult, makeErrorResult } from '@urql/core';

interface ExecuteExchangeArgs {
  schema: GraphQLSchema;
  rootValue?: any;
  contextValue?: any;
  fieldResolver?: GraphQLFieldResolver<any, any>;
  typeResolver?: GraphQLTypeResolver<any, any>;
}

const SUPPORTED_OPERATION_TYPES = ['query', 'mutation'];

/** Exchange for executing queries locally on a schema using graphql-js. */
export const executeExchange = ({
  schema,
  rootValue,
  contextValue,
  fieldResolver,
  typeResolver,
}: ExecuteExchangeArgs): Exchange => ({ forward }) => {
  return ops$ => {
    const sharedOps$ = share(ops$);

    const executedOps$ = pipe(
      sharedOps$,
      filter(operation =>
        SUPPORTED_OPERATION_TYPES.includes(operation.operationName)
      ),
      map(async operation => {
        try {
          const result = await execute(
            schema,
            operation.query,
            rootValue,
            typeof contextValue === 'function' ? contextValue() : contextValue,
            operation.variables,
            operation.operationName,
            fieldResolver,
            typeResolver
          );
          return makeResult(operation, result);
        } catch (err) {
          return makeErrorResult(operation, err);
        }
      }),
      mergeMap(pipe => fromPromise(pipe))
    );

    const forwardedOps$ = pipe(
      sharedOps$,
      filter(
        operation =>
          !SUPPORTED_OPERATION_TYPES.includes(operation.operationName)
      ),
      forward
    );

    return merge([executedOps$, forwardedOps$]);
  };
};
