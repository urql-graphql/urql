import { useContext, useState } from 'react';
import { pipe, toPromise } from 'wonka';
import { Context } from '../context';
import { CombinedError, createMutation } from '../utils';

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
      const { data, error } = await pipe(
        client.executeMutation(createMutation(query, variables)),
        toPromise
      );
      setState({ fetching: false, data, error });
    } catch (error) {
      setState({ ...state, fetching: false, error });
    }
  };

  return [state, executeMutation];
};
