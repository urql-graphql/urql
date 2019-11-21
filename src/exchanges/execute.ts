import {
  pipe,
  tap,
  share,
  filter,
  map,
  fromPromise,
  mergeAll,
  merge,
} from 'wonka';
import { Exchange } from '../types';
import {
  GraphQLSchema,
  GraphQLFieldResolver,
  GraphQLTypeResolver,
  graphql,
  print,
} from 'graphql';
import { CombinedError } from 'src/utils';

interface ExecuteExchangeArgs {
  schema: GraphQLSchema;
  rootValue?: any;
  contextValue?: any;
  fieldResolver?: GraphQLFieldResolver<any, any>;
  typeResolver?: GraphQLTypeResolver<any, any>;
}
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
    const targetOperationTypes = ['query', 'mutation', 'subscription'];

    const executedOps$ = pipe(
      sharedOps$,
      filter(f => targetOperationTypes.includes(f.operationName)),
      map(operation =>
        graphql(
          schema,
          print(operation.query),
          rootValue,
          contextValue,
          operation.variables,
          operation.operationName,
          fieldResolver,
          typeResolver
        )
          .then(r => ({
            operation,
            data: r.data,
            error: Array.isArray(r.errors)
              ? new CombinedError({
                  graphQLErrors: r.errors,
                  response: r,
                })
              : undefined,
          }))
          .catch(networkError => ({
            operation,
            data: undefined,
            error: new CombinedError({
              networkError,
              response: networkError,
            }),
          }))
      ),
      map(fromPromise),
      mergeAll
    );

    const forwardedOps$ = pipe(
      sharedOps$,
      filter(o => !targetOperationTypes.includes(o.operationName)),
      forward
    );

    return merge([forwardedOps$, executedOps$]);
  };
};
