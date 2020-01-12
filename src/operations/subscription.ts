import { RequestPolicy, OperationContext, createRequest } from 'urql/core';
import { pipe, subscribe } from 'wonka';
import { DocumentNode } from 'graphql';
import { observe } from 'svelte-observable';
import { getClient } from '../context';

export interface SubscriptionArguments<Variables> {
  query: DocumentNode | string;
  variables?: V;
  pause?: boolean;
  context?: Partial<OperationContext>;
}

export const subscribe = <Variables = object>(
  args: QueryArguments<Variables>
) => {
  const client = getClient();
  const request = createRequest(args.query, args.variables as any);

  const observable = pipe(
    client.executeSubscription(request, args.context),
    subscribe(arg => arg)
  );

  return observe(observable);
};
