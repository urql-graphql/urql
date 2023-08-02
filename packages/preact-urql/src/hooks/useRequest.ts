import type { DocumentNode } from 'graphql';
import { useRef, useMemo } from 'preact/hooks';
import type {
  AnyVariables,
  TypedDocumentNode,
  GraphQLRequest,
} from '@urql/core';
import { createRequest } from '@urql/core';

/** Creates a request from a query and variables but preserves reference equality if the key isn't changing
 * @internal
 */
export function useRequest<
  Data = any,
  Variables extends AnyVariables = AnyVariables,
>(
  query: string | DocumentNode | TypedDocumentNode<Data, Variables>,
  variables: Variables
): GraphQLRequest<Data, Variables> {
  const prev = useRef<undefined | GraphQLRequest<Data, Variables>>(undefined);
  return useMemo(() => {
    const request = createRequest<Data, Variables>(query, variables);
    // We manually ensure reference equality if the key hasn't changed
    if (prev.current !== undefined && prev.current.key === request.key) {
      return prev.current;
    } else {
      prev.current = request;
      return request;
    }
  }, [query, variables]);
}
