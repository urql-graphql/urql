import { Readable, writable } from 'svelte/store';
import { DocumentNode } from 'graphql';
import { OperationContext, CombinedError } from '@urql/core';

import { _storeUpdate } from './internal';

const emptyUpdate = Object.create(null);

type Updater<T> = (value: T) => T;

/**
 * This Svelte store wraps both a `GraphQLRequest` and an `OperationResult`.
 * It can be used to update the query and read the subsequent result back.
 */
export interface OperationStore<Data = any, Vars = any>
  extends Readable<OperationStore<Data, Vars>> {
  // Input properties
  query: DocumentNode | string;
  variables: Vars | undefined | null;
  context: Partial<OperationContext> | undefined;
  // Output properties
  readonly stale: boolean;
  readonly fetching: boolean;
  readonly data: Data | undefined;
  readonly error: CombinedError | undefined;
  readonly extensions: Record<string, any> | undefined;
  // Writable properties
  set(value: Partial<OperationStore<Data, Vars>>): void;
  update(updater: Updater<Partial<OperationStore<Data, Vars>>>): void;
}

export function operationStore<Data = any, Vars = object>(
  query: string | DocumentNode,
  variables?: Vars | null,
  context?: Partial<OperationContext & { pause: boolean }>
): OperationStore<Data, Vars> {
  const internal = {
    query,
    variables,
    context,
  };

  const state = {
    stale: false,
    fetching: true,
    data: undefined,
    error: undefined,
    extensions: undefined,
  } as OperationStore<Data, Vars>;

  const svelteStore = writable(state);
  let _internalUpdate = false;

  state.set = function set(value?: Partial<typeof state>) {
    if (!value || value === state) value = emptyUpdate;

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

      _storeUpdate.delete(value!);
    }

    for (const key in value) {
      if (key === 'query' || key === 'variables' || key === 'context') {
        (internal as any)[key] = value[key];
      } else if (key === 'fetching') {
        (state as any)[key] = !!value[key];
      } else if (key in state) {
        state[key] = value[key];
      }
    }

    (state as any).stale = !!value!.stale;

    _internalUpdate = false;
    svelteStore.set(state);
  };

  state.update = function update(fn: Updater<typeof state>): void {
    state.set(fn(state));
  };

  state.subscribe = function subscribe(run, invalidate) {
    return svelteStore.subscribe(run, invalidate);
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
