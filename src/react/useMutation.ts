import { useContext, useEffect, useState } from 'react';
import { pipe, toPromise } from 'wonka';
import { createMutation } from '../lib';
import { Context } from './context';

export const useMutation = (query: string) => {
  const client = useContext(Context);
  const [state, setState] = useState({
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
