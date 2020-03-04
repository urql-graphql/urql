import { createRequest, OperationResult, OperationContext } from '@urql/core';
import { DocumentNode } from 'graphql';
import { pipe, toPromise } from 'wonka';

import { getClient } from '../context';

export const mutate = <T = any, V = object>(
  query: string | DocumentNode,
  variables?: V,
  context?: Partial<OperationContext>
): PromiseLike<OperationResult<T>> => {
  const client = getClient();
  const request = createRequest(query, variables as any);
  const mutationResult$ = client.executeMutation(request, context);

  let promise: Promise<OperationResult<T>>;

  return {
    then(onValue) {
      if (!promise) promise = pipe(mutationResult$, toPromise);
      return promise.then(onValue);
    },
  };
};
