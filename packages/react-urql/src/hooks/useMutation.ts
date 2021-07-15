import { DocumentNode } from 'graphql';
import { useState, useCallback, useRef, useEffect } from 'react';
import { pipe, toPromise } from 'wonka';

import {
  TypedDocumentNode,
  OperationResult,
  OperationContext,
  CombinedError,
  createRequest,
  Operation,
} from '@urql/core';

import { useClient } from '../context';
import { initialState } from './state';

export interface UseMutationState<Data = any, Variables = object> {
  fetching: boolean;
  stale: boolean;
  data?: Data;
  error?: CombinedError;
  extensions?: Record<string, any>;
  operation?: Operation<Data, Variables>;
}

export type UseMutationResponse<Data = any, Variables = object> = [
  UseMutationState<Data, Variables>,
  (
    variables?: Variables,
    context?: Partial<OperationContext>
  ) => Promise<OperationResult<Data, Variables>>
];

export function useMutation<Data = any, Variables = object>(
  query: DocumentNode | TypedDocumentNode<Data, Variables> | string,
  globalMutationContext?: Partial<OperationContext>
): UseMutationResponse<Data, Variables> {
  const isMounted = useRef(true);
  const client = useClient();

  const [state, setState] = useState<UseMutationState<Data, Variables>>(
    initialState
  );

  const executeMutation = useCallback(
    (variables?: Variables, context?: Partial<OperationContext>) => {
      setState({ ...initialState, fetching: true });

      let mutationContext = globalMutationContext || {};

      if (context) {
        mutationContext = context;
      }

      return pipe(
        client.executeMutation<Data, Variables>(
          createRequest<Data, Variables>(query, variables),
          mutationContext
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
    [client, query, setState, globalMutationContext]
  );

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  return [state, executeMutation];
}
