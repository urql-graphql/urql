import { createRequest, OperationContext } from 'urql/core';
import { DocumentNode } from 'graphql';
import { pipe, toPromise } from 'wonka';
import { getClient } from './getClient';

export const mutate = <Response = any, Variables = object>(
  query: DocumentNode | string
): ((
  variables?: Variables,
  context?: Partial<OperationContext>
) => Promise<Response>) => {
  const client = getClient();

  const executeMutation = (
    variables?: Variables,
    context?: Partial<OperationContext>
  ): Promise<any> => {
    const request = createRequest(query, variables as any);
    return pipe(client.executeMutation(request, context || {}), toPromise);
  };

  return executeMutation;
};
