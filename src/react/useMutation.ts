import { useContext, useState } from 'react';
import { pipe, toPromise } from 'wonka';
import { CombinedError, createMutation } from '../lib';
import { Context } from './context';

interface UseMutationState<T> {
  fetching: boolean;
  data?: T;
  error?: CombinedError;
}

type UseMutationResponse<T> = [UseMutationState<T>, (variables: any) => void];

export const useMutation = <T = any>(query: string): UseMutationResponse<T> => {
  const client = useContext(Context);
  const [state, setState] = useState<UseMutationState<T>>({
    fetching: false,
    error: undefined,
    data: undefined,
  });

  const executeMutation = async (variables: object) => {
    setState({ fetching: true, error: undefined, data: undefined });

    try {
      const data = await pipe(
        client.executeMutation(createMutation(query, variables)),
        toPromise
      )[0];
      setState({ ...state, fetching: false, data });
    } catch (error) {
      setState({ ...state, fetching: false, error });
    }
  };

  return [state, executeMutation];
};
