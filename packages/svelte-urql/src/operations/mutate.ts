import { pipe, subscribe } from 'wonka';
import { OperationResult, OperationContext } from '@urql/core';
import { Readable } from 'svelte/store';
import { DocumentNode } from 'graphql';

import { getClient } from '../context';

export interface MutationArguments<V> {
  query: string | DocumentNode;
  variables?: V;
  context?: Partial<OperationContext>;
}

export interface MutationStore<T = any, V = object>
  extends Readable<OperationResult<T>>,
    PromiseLike<OperationResult<T>> {
  (additionalArgs?: Partial<MutationArguments<V>>): Promise<OperationResult<T>>;
}

export const mutate = <T = any, V = object>(
  args: MutationArguments<V>
): MutationStore<T, V> => {
  const client = getClient();

  function mutate$(additionalArgs?: Partial<MutationArguments<V>>) {
    const mergedArgs = { ...args, ...additionalArgs };
    return client
      .mutation(
        mergedArgs.query,
        mergedArgs.variables as any,
        mergedArgs.context
      )
      .toPromise();
  }

  mutate$.subscribe = (onValue: (result: OperationResult<T>) => void) => {
    return pipe(
      client.mutation(args.query, args.variables as any, args.context),
      subscribe(onValue)
    ).unsubscribe;
  };

  mutate$.then = (
    onValue: (result: OperationResult<T>) => any
  ): Promise<any> => {
    return mutate$().then(onValue);
  };

  return mutate$ as any;
};
