import { createRequest, OperationContext } from 'urql/core';
import { DocumentNode } from 'graphql';
import { pipe, toPromise } from 'wonka';
import { getClient } from '../context/getClient';

export const mutate = <Response = any, Variables = object>(
  query: DocumentNode | string
): ((
  variables?: Variables,
  context?: Partial<OperationContext>
) => Promise<Response>) => (
  variables?: Variables,
  context?: Partial<OperationContext>
): Promise<any> => {
  // TODO: temp
  const request = createRequest(query, variables as any);
  return pipe(getClient().executeMutation(request, context || {}), toPromise);
};
