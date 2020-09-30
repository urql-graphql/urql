import { Writable, writable } from 'svelte/store';
import { DocumentNode } from 'graphql';
import { OperationContext, CombinedError } from '@urql/core';

import { _storeUpdate } from './internal';

const noop = Object.create(null);

type Updater<T> = (value: T) => T;

/**
 * This Svelte store wraps both a `GraphQLRequest` and an `OperationResult`.
 * It can be used to update the query and read the subsequent result back.
 */
export interface OperationStore<Data = any, Vars = any>
  extends Writable<OperationStore<Data, Vars>> {
  // Input properties
  query: DocumentNode | string;
  variables: Vars | undefined | null;
  context: Partial<OperationContext> | undefined;
  // Output properties
  readonly stale: boolean;
  readonly fetching: boolean;
  readonly data: Data | void;
  readonly error?: CombinedError | void;
  readonly extensions?: Record<string, any> | void;
}

export function operationStore<Data = any, Vars = object>(
  query: string | DocumentNode,
  variables?: Vars | null,
  context?: Partial<OperationContext>
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

  const store = writable(state);
  const invalidate = store.set.bind(null, state);

  let _internalUpdate = false;

  function set(value?: Partial<typeof state>) {
    if (!value) value = noop;

    _internalUpdate = true;
    if (process.env.NODE_ENV !== 'production') {
      if (!_storeUpdate.has(value!)) {
        for (const key in value) {
          if (key !== 'query' && key !== 'variables') {
            throw new TypeError(
              'It is not allowed to update result properties on an OperationStore .'
            );
          }
        }
      }

      _storeUpdate.delete(value!);
    }

    for (const key in value) {
      if (key === 'query' || key === 'variables' || key === 'context') {
        (internal as any)[key] = value[key];
      } else if (key === 'stale' || key === 'fetching') {
        (state as any)[key] = !!value[key];
      } else if (key in state) {
        state[key] = value[key];
      }
    }

    _internalUpdate = false;
    invalidate();
  }

  function update(fn: Updater<typeof state>): void {
    set(fn(state));
  }

  state.set = set;
  state.update = update;
  state.subscribe = store.subscribe;

  let result = state;
  if (process.env.NODE_ENV !== 'production') {
    result = { ...state };

    for (const prop in state) {
      Object.defineProperty(result, prop, {
        configurable: false,
        get() {
          return state[prop];
        },
        set() {
          throw new TypeError(
            'It is not allowed to update result properties on an OperationStore .'
          );
        },
      });
    }
  }

  for (const prop in internal) {
    Object.defineProperty(result, 'query', {
      configurable: false,
      get: () => internal[prop],
      set(value) {
        internal[prop] = value;
        if (!_internalUpdate) invalidate();
      },
    });
  }

  return result as OperationStore<Data, Vars>;
}
