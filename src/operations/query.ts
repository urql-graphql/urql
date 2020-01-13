import { RequestPolicy, OperationContext, createRequest } from 'urql/core';
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

  return observe(
    client.executeQuery(request, {
      requestPolicy: args.requestPolicy,
      pollInterval: args.pollInterval,
      ...args.context,
    })
  );
};
