import { RequestPolicy, OperationContext, createRequest } from '@urql/core';
import { DocumentNode } from 'graphql';
import { getClient } from '../context';
import { observe } from './observe';

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
  const request = createRequest(args.query, args.variables as any);

  // Temp solution since I haven't had the chance yet to see how a sync result would look like in svelte
  let initialValue;
  client
    .query(args.query, args.variables as any, { requestPolicy: 'cache-only' })
    .toPromise()
    .then(i => {
      initialValue = i;
    });

  if (args.pause) {
    // TODO: this is a tough cookie since we still have to return a .subscribe
    // We can return the initialValue fetched above!
  }

  const result = observe(
    client.executeQuery(request, {
      requestPolicy: args.requestPolicy,
      pollInterval: args.pollInterval,
      ...args.context,
    }),
    initialValue
  );

  return {
    subscribe: result.subscribe,
  };
};
