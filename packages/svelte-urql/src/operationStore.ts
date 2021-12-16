import { Readable, writable } from 'svelte/store';
import { DocumentNode } from 'graphql';
import { TypedDocumentNode } from '@graphql-typed-document-node/core';
import {
  OperationContext,
  CombinedError,
  createRequest,
  stringifyVariables,
} from '@urql/core';

import { _storeUpdate } from './internal';

type Updater<T> = (value: T) => T;

/**
 * This Svelte store wraps both a `GraphQLRequest` and an `OperationResult`.
 * It can be used to update the query and read the subsequent result back.
 */
export interface OperationStore<Data = any, Vars = any, Result = Data>
  extends Readable<OperationStore<Data, Vars, Result>> {
  // Input properties
  query: DocumentNode | TypedDocumentNode<Data, Vars> | string;
  variables: Vars | null;
  context: Partial<OperationContext & { pause: boolean }> | undefined;
  // Output properties
  readonly stale: boolean;
  readonly fetching: boolean;
  readonly data: Result | undefined;
  readonly error: CombinedError | undefined;
  readonly extensions: Record<string, any> | undefined;
  // Writable properties
  set(value: Partial<OperationStore<Data, Vars, Result>>): void;
  update(updater: Updater<Partial<OperationStore<Data, Vars, Result>>>): void;
  // Imperative methods
  reexecute(context?: Partial<OperationContext> | undefined): void;
}

export function operationStore<Data = any, Vars = object, Result = Data>(
  query: string | DocumentNode | TypedDocumentNode<Data, Vars>,
  variables?: Vars | null,
  context?: Partial<OperationContext & { pause: boolean }>
): OperationStore<Data, Vars, Result> {
  const internal = {
    query,
    variables: variables || null,
    context,
  };

  const state = {
    stale: false,
    fetching: false,
    data: undefined,
    error: undefined,
    extensions: undefined,
  } as OperationStore<Data, Vars, Result>;

  const svelteStore = writable(state);
  let _internalUpdate = false;

  state.set = function set(value?: Partial<typeof state>) {
    if (!value || value === state) return;

    _internalUpdate = true;
    if (process.env.NODE_ENV !== 'production') {
      if (!_storeUpdate.has(value!)) {
        for (const key in value) {
          if (!(key in internal)) {
            throw new TypeError(
              'It is not allowed to update result properties on an OperationStore.'
            );
          }
        }
      }
    }

    let hasUpdate = false;

    if ('query' in value! || 'variables' in value!) {
      const prev = createRequest(
        internal.query,
        internal.variables || undefined
      );
      const next = createRequest(
        value.query || internal.query,
        value.variables || internal.variables
      );
      if (prev.key !== next.key) {
        hasUpdate = true;
        internal.query = value.query || internal.query;
        internal.variables = value.variables || internal.variables || null;
      }
    }

    if ('context' in value!) {
      const prevKey = stringifyVariables(internal.context);
      const nextKey = stringifyVariables(value.context);
      if (prevKey !== nextKey) {
        hasUpdate = true;
        internal.context = value.context;
      }
    }

    for (const key in value) {
      if (key === 'query' || key === 'variables' || key === 'context') {
        continue;
      } else if (key === 'fetching') {
        (state as any)[key] = !!value[key];
      } else if (key in state) {
        state[key] = value[key];
      }

      hasUpdate = true;
    }

    (state as any).stale = !!value!.stale;

    _internalUpdate = false;
    if (hasUpdate) svelteStore.set(state);
  };

  state.update = function update(fn: Updater<typeof state>): void {
    state.set(fn(state));
  };

  state.subscribe = function subscribe(run, invalidate) {
    return svelteStore.subscribe(run, invalidate);
  };

  state.reexecute = function (context) {
    internal.context = { ...(context || internal.context) };
    svelteStore.set(state);
  };

  Object.keys(internal).forEach(prop => {
    Object.defineProperty(state, prop, {
      configurable: false,
      get: () => internal[prop],
      set(value) {
        internal[prop] = value;
        if (!_internalUpdate) svelteStore.set(state);
      },
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const result = { ...state };

    Object.keys(state).forEach(prop => {
      Object.defineProperty(result, prop, {
        configurable: false,
        get() {
          return state[prop];
        },
        set() {
          throw new TypeError(
            'It is not allowed to update result properties on an OperationStore.'
          );
        },
      });
    });

    Object.keys(internal).forEach(prop => {
      Object.defineProperty(result, prop, {
        configurable: false,
        get: () => internal[prop],
        set(value) {
          internal[prop] = value;
          if (!_internalUpdate) svelteStore.set(state);
        },
      });
    });

    return result;
  }

  return state;
}
