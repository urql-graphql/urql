import { MaybeAccessor, asAccessor } from '@solid-primitives/utils';
import {
  type AnyVariables,
  type DocumentInput,
  type Operation,
  type OperationContext,
  CombinedError,
  createRequest,
  OperationResult,
  OperationResultSource,
} from '@urql/core';
import { useClient } from './context';
import { createStore } from 'solid-js/store';
import { createComputed, onCleanup } from 'solid-js';
import {
  concat,
  fromValue,
  makeSubject,
  map,
  pipe,
  scan,
  subscribe,
  switchMap,
} from 'wonka';

type CreateSubscriptionArgs<
  Data,
  Variables extends AnyVariables = AnyVariables
> = {
  query: DocumentInput<Data, Variables>;
  variables?: MaybeAccessor<Variables>;
  context?: MaybeAccessor<Partial<OperationContext>>;
  pause?: MaybeAccessor<boolean>;
};

type CreateSubscriptionState<
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

export type SubscriptionHandler<T, R> = (prev: R | undefined, data: T) => R;

export const createSubscription = <
  Data,
  Result = Data,
  Variables extends AnyVariables = AnyVariables
>(
  args: CreateSubscriptionArgs<Data, Variables>,
  handler?: SubscriptionHandler<Data, Result>
) => {
  const getContext = asAccessor(args.context),
    getPause = asAccessor(args.pause),
    getVariables = asAccessor(args.variables);

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

  const operationSubject = makeSubject<
    OperationResultSource<OperationResult<Data, Variables>> | undefined
  >();
  const [state, setState] =
    createStore<CreateSubscriptionState<Result, Variables>>(initialState);

  const sub = pipe(
    operationSubject.source,
    switchMap(subscription$ => {
      if (subscription$ === undefined) {
        return fromValue({ fetching: false });
      }

      return concat([
        fromValue({ fetching: true, stale: false }),
        pipe(
          subscription$,
          map(it => ({
            fetching: true,
            stale: !!it.stale,
            data: it.data,
            error: it.error,
            extensions: it.extensions,
            operation: it.operation,
          }))
        ),
        fromValue({ fetching: false, stale: false }),
      ]);
    }),
    scan((result: CreateSubscriptionState<Result, Variables>, partial: any) => {
      const data =
        partial.data !== undefined
          ? typeof handler === 'function'
            ? handler(result.data, partial.data)
            : partial.data
          : result.data;

      return {
        ...result,
        ...partial,
        data: data,
      };
    }, initialState),
    subscribe(result => {
      setState(result);
    })
  );

  onCleanup(() => {
    sub.unsubscribe();
  });

  createComputed(() => {
    if (getPause() === true) {
      operationSubject.next(undefined);
      return;
    }

    const ctx = getContext();
    const req = createRequest(args.query, getVariables() as Variables);
    operationSubject.next(
      client.executeSubscription<Data, Variables>(req, ctx)
    );
  });

  const execute = (opts?: Partial<OperationContext>) => {
    const ctx = getContext();
    const req = createRequest(args.query, getVariables() as Variables);
    operationSubject.next(
      client.executeSubscription<Data, Variables>(req, {
        ...ctx,
        ...opts,
      })
    );
  };

  return [state, execute] as const;
};
