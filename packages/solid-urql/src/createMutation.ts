import { createStore } from 'solid-js/store';
import {
  createRequest,
  type AnyVariables,
  type DocumentInput,
  OperationContext,
  CombinedError,
  Operation,
} from '@urql/core';
import { useClient } from './context';
import { pipe, onPush, filter, take, toPromise } from 'wonka';

export type CreateMutationState<
  Data = any,
  Variables extends AnyVariables = AnyVariables
> = {
  fetching: boolean;
  stale: boolean;
  data?: Data;
  error?: CombinedError;
  extensions?: Record<string, any>;
  operation?: Operation<Data, Variables>;
};

export const createMutation = <
  Data = any,
  Variables extends AnyVariables = AnyVariables
>(
  query: DocumentInput<Data, Variables>
) => {
  const client = useClient();
  const initialResult: CreateMutationState<Data, Variables> = {
    operation: undefined,
    fetching: false,
    stale: false,
    data: undefined,
    error: undefined,
    extensions: undefined,
  };

  const [state, setState] =
    createStore<CreateMutationState<Data, Variables>>(initialResult);

  const execute = (
    variables: Variables,
    context?: Partial<OperationContext>
  ) => {
    setState({ ...initialResult, fetching: true });

    const request = createRequest(query, variables);
    return pipe(
      client.executeMutation(request, context ?? {}),
      onPush(result => {
        setState({
          fetching: false,
          stale: result.stale,
          data: result.data,
          error: result.error,
          extensions: result.extensions,
          operation: result.operation,
        });
      }),
      filter(result => !result.hasNext),
      take(1),
      toPromise
    );
  };

  return [state, execute] as const;
};
