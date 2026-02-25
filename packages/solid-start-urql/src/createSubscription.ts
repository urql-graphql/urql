import { type MaybeAccessor, asAccessor } from './utils';
import {
  type AnyVariables,
  type DocumentInput,
  type Operation,
  type OperationContext,
  type OperationResult,
  type CombinedError,
  createRequest,
} from '@urql/core';
import { useClient } from './context';
import { createStore, produce, reconcile } from 'solid-js/store';
import {
  batch,
  createComputed,
  createSignal,
  onCleanup,
  untrack,
} from 'solid-js';
import { type Source, onEnd, pipe, subscribe } from 'wonka';

export type CreateSubscriptionExecute = (
  opts?: Partial<OperationContext>
) => void;

export type CreateSubscriptionArgs<
  Data,
  Variables extends AnyVariables = AnyVariables,
> = {
  query: DocumentInput<Data, Variables>;
  variables?: MaybeAccessor<Variables>;
  context?: MaybeAccessor<Partial<OperationContext>>;
  pause?: MaybeAccessor<boolean>;
};

export type CreateSubscriptionState<
  Data = any,
  Variables extends AnyVariables = AnyVariables,
> = {
  fetching: boolean;
  stale: boolean;
  data?: Data;
  error?: CombinedError;
  extensions?: Record<string, any>;
  operation?: Operation<Data, Variables>;
};

export type SubscriptionHandler<T, R> = (prev: R | undefined, data: T) => R;

export type CreateSubscriptionResult<
  Data,
  Variables extends AnyVariables = AnyVariables,
> = [CreateSubscriptionState<Data, Variables>, CreateSubscriptionExecute];

export const createSubscription = <
  Data,
  Result = Data,
  Variables extends AnyVariables = AnyVariables,
>(
  args: CreateSubscriptionArgs<Data, Variables>,
  handler?: SubscriptionHandler<Data, Result>
): CreateSubscriptionResult<Result, Variables> => {
  const getContext = asAccessor(args.context);
  const getPause = asAccessor(args.pause);
  const getVariables = asAccessor(args.variables);

  const client = useClient();

  const request = createRequest(args.query, getVariables() as Variables);
  const operation = client.createRequestOperation(
    'subscription',
    request,
    getContext()
  );
  const initialState: CreateSubscriptionState<Result, Variables> = {
    operation,
    fetching: false,
    data: undefined,
    error: undefined,
    extensions: undefined,
    stale: false,
  };

  const [source, setSource] = createSignal<
    Source<OperationResult<Data, Variables>> | undefined
  >(undefined, { equals: false });

  const [state, setState] =
    createStore<CreateSubscriptionState<Result, Variables>>(initialState);

  createComputed(() => {
    if (getPause() === true) {
      setSource(undefined);
      return;
    }

    const context = getContext();
    const request = createRequest(args.query, getVariables() as Variables);
    setSource(() => client.executeSubscription(request, context));
  });

  createComputed(() => {
    const s = source();
    if (s === undefined) {
      setState('fetching', false);

      return;
    }

    setState('fetching', true);
    onCleanup(
      pipe(
        s,
        onEnd(() => {
          setState(
            produce(draft => {
              draft.fetching = false;
            })
          );
        }),
        subscribe(res => {
          batch(() => {
            if (res.data !== undefined) {
              const newData =
                typeof handler === 'function'
                  ? handler(
                      untrack(() => state.data),
                      res.data
                    )
                  : (res.data as Result);
              setState('data', reconcile(newData));
            }
            setState(
              produce(draft => {
                draft.stale = !!res.stale;
                draft.fetching = true;
                draft.error = res.error;
                draft.operation = res.operation;
                draft.extensions = res.extensions;
              })
            );
          });
        })
      ).unsubscribe
    );
  });

  const executeSubscription = (opts?: Partial<OperationContext>) => {
    const context: Partial<OperationContext> = {
      ...getContext(),
      ...opts,
    };
    const request = createRequest(args.query, getVariables() as Variables);

    setSource(() => client.executeSubscription(request, context));
  };

  return [state, executeSubscription];
};
