import { pipe, share, filter, map, fromPromise, mergeMap, merge } from 'wonka';
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

const SUPPORTED_OPERATION_TYPES = ['query', 'mutation'];

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
      filter((operation: Operation) =>
        SUPPORTED_OPERATION_TYPES.includes(operation.operationName)
      ),
      map(async (operation: Operation) => {
        try {
          const calculatedContext =
            typeof context === 'function' ? context(operation) : context;
          const result = await execute(
            schema,
            operation.query,
            rootValue,
            calculatedContext,
            operation.variables,
            getOperationName(operation.query),
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
        (operation: Operation) =>
          !SUPPORTED_OPERATION_TYPES.includes(operation.operationName)
      ),
      forward
    );

    return merge([executedOps$, forwardedOps$]);
  };
};
