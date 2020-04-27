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
): Promise<OperationResult<T>> => {
  return getClient()
    .mutation(args.query, args.variables as any, args.context)
    .toPromise();
};
