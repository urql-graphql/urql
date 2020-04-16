import { OperationResult, OperationContext } from '@urql/core';
import { DocumentNode } from 'graphql';

import { getClient } from '../context';

export interface MutationArguments<V> {
  query: string | DocumentNode;
  variables?: V;
  context?: Partial<OperationContext>;
}

export const mutate = <T = any, V = object>(
  args: MutationArguments<V>
): PromiseLike<OperationResult<T>> => {
  const client = getClient();
  let promise: Promise<OperationResult<T>>;

  return {
    then(onValue) {
      if (!promise) {
        promise = client
          .mutation(args.query, args.variables as any, args.context)
          .toPromise();
      }

      return promise.then(onValue);
    },
  };
};
