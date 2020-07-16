import { DocumentNode } from 'graphql';
import { useRef, useMemo } from 'react';
import { GraphQLRequest, createRequest } from '@urql/core';

/** Creates a request from a query and variables but preserves reference equality if the key isn't changing */
export function useRequest(
  query: string | DocumentNode,
  variables?: any
): GraphQLRequest {
  const prev = useRef<undefined | GraphQLRequest>(undefined);

  return useMemo(() => {
    const request = createRequest(query, variables);
    // We manually ensure reference equality if the key hasn't changed
    if (prev.current !== undefined && prev.current.key === request.key) {
      return prev.current;
    } else {
      prev.current = request;
      return request;
    }
  }, [query, variables]);
}
