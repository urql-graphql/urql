import { DocumentNode } from 'graphql';
import { useState, useCallback, useRef, useEffect } from 'react';
import { pipe, toPromise } from 'wonka';

import {
  AnyVariables,
  TypedDocumentNode,
  OperationResult,
  OperationContext,
  CombinedError,
  createRequest,
  Operation,
} from '@urql/core';

import { useClient } from '../context';
import { initialState } from './state';

export interface UseMutationState<
  Data = any,
  Variables extends AnyVariables = AnyVariables
> {
  fetching: boolean;
  stale: boolean;
  data?: Data;
  error?: CombinedError;
  extensions?: Record<string, any>;
  operation?: Operation<Data, Variables>;
}

export type UseMutationResponse<
  Data = any,
  Variables extends AnyVariables = AnyVariables
> = [
  UseMutationState<Data, Variables>,
  (
    variables: Variables,
    context?: Partial<OperationContext>
  ) => Promise<OperationResult<Data, Variables>>
];

export function useMutation<
  Data = any,
  Variables extends AnyVariables = AnyVariables
>(
  query: DocumentNode | TypedDocumentNode<Data, Variables> | string
): UseMutationResponse<Data, Variables> {
  const isMounted = useRef(true);
  const client = useClient();

  const [state, setState] = useState<UseMutationState<Data, Variables>>(
    initialState
  );

  const executeMutation = useCallback(
    (variables: Variables, context?: Partial<OperationContext>) => {
      setState({ ...initialState, fetching: true });

      return pipe(
        client.executeMutation<Data, Variables>(
          createRequest<Data, Variables>(query, variables),
          context || {}
        ),
        toPromise
      ).then(result => {
        if (isMounted.current) {
          setState({
            fetching: false,
            stale: !!result.stale,
            data: result.data,
            error: result.error,
            extensions: result.extensions,
            operation: result.operation,
          });
        }
        return result;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [client, query, setState]
  );

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return [state, executeMutation];
}
