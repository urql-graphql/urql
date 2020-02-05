import { OperationContext, createRequest } from 'urql/core';
import { DocumentNode } from 'graphql';
import { getClient } from '../context';
import { observe } from './observe';

export interface SubscriptionArguments<Variables> {
  query: DocumentNode | string;
  variables?: Variables;
  pause?: boolean;
  context?: Partial<OperationContext>;
}

export const subscribe = <Variables = object>(
  args: SubscriptionArguments<Variables>
) => {
  const client = getClient();
  const request = createRequest(args.query, args.variables as any);

  return observe(client.executeSubscription(request, args.context));
};
