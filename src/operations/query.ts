import { RequestPolicy, OperationContext, createRequest } from 'urql/core';
import { readable } from 'svelte/store';
import { DocumentNode } from 'graphql';
import { observe } from 'svelte-observable';
import { getClient } from '../context';

export interface QueryArguments<Variables> {
  query: string | DocumentNode;
  variables?: Variables;
  requestPolicy?: RequestPolicy;
  pollInterval?: number;
  context?: Partial<OperationContext>;
  pause?: boolean;
}

export const query = <Variables = object>(args: QueryArguments<Variables>) => {
  const client = getClient();
  // TODO: temp
  const request = createRequest(args.query, args.variables as any);

  const observable = client.executeQuery(request, { // pipe(
    requestPolicy: args.requestPolicy,
    pollInterval: args.pollInterval,
    ...args.context,
  });
  // subscribe,
  // )

  const { subscribe: observableSubscribtion } = observe(observable);

  // Wrap the query subscription with a readable to prevent duplicate values
  const { subscribe } = readable(undefined, set => {
    let initialized = false;
    let skipped = false;

    const unsubscribe = observableSubscribtion(value => {
      if (initialized && !skipped) {
        skipped = true;
      } else {
        if (!initialized) initialized = true;
        set(value);
      }
    });

    return unsubscribe;
  });

  return {
    executeQuery: () => {
      // Smth
    },
    result: () => {
      // Smth
    },
    subscribe,
  };
};
