import { DocumentNode } from 'graphql';
import { useContext, useState } from 'react';
import { pipe, toPromise } from 'wonka';
import { Context } from '../context';
import { OperationResult } from '../types';
import { CombinedError, createRequest } from '../utils';

interface UseMutationState<T> {
  fetching: boolean;
  data?: T;
  error?: CombinedError;
}

type UseMutationResponse<T> = [
  UseMutationState<T>,
  (variables?: object) => Promise<OperationResult>
];

export const useMutation = <T = any>(
  query: DocumentNode | string
): UseMutationResponse<T> => {
  const client = useContext(Context);
  const [state, setState] = useState<UseMutationState<T>>({
    fetching: false,
    error: undefined,
    data: undefined,
  });

  const executeMutation = (variables?: object) => {
    setState({ fetching: true, error: undefined, data: undefined });

    const request = createRequest(query, variables);

    return pipe(
      client.executeMutation(request),
      toPromise
    )
      .then(result => {
        const { data, error } = result;
        setState({ fetching: false, data, error });
        return result;
      })
      .catch(networkError => {
        const error = new CombinedError({ networkError });
        setState({ fetching: false, data: undefined, error });
        return { data: undefined, error } as OperationResult;
      });
  };

  return [state, executeMutation];
};
