import { OperationResult, OperationContext } from '@urql/core';
import { DocumentNode } from 'graphql';

import { getClient } from '../context';

export const mutate = <T = any, V = object>(
  query: string | DocumentNode,
  variables?: V,
  context?: Partial<OperationContext>
): PromiseLike<OperationResult<T>> => {
  const client = getClient();
  let promise: Promise<OperationResult<T>>;

  return {
    then(onValue) {
      if (!promise) {
        promise = client.mutation(query, variables as any, context).toPromise();
      }

      return promise.then(onValue);
    },
  };
};
