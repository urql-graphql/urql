import { Writable, writable } from 'svelte/store';
import { DocumentNode } from 'graphql';
import { CombinedError } from '@urql/core';

import { _storeUpdate } from './internal';

type Updater<T> = (value: T) => T;

/**
 * This Svelte store wraps both a `GraphQLRequest` and an `OperationResult`.
 * It can be used to update the query and read the subsequent result back.
 */
export interface OperationStore<Data = any, Vars = any>
  extends Writable<OperationStore<Data, Vars>> {
  // Input properties
  query: DocumentNode | string;
  variables: Vars | void | null;
  // Output properties
  readonly stale: boolean;
  readonly fetching: boolean;
  readonly data: Data | void;
  readonly error?: CombinedError | void;
  readonly extensions?: Record<string, any> | void;
}

export function operationStore<Data = any, Vars = object>(
  query: string | DocumentNode,
  variables?: Vars | null
): OperationStore<Data, Vars> {
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

  function set(value: Partial<typeof state>) {
    _internalUpdate = true;
    if (process.env.NODE_ENV !== 'production') {
      _storeUpdate.delete(value);
      if (!_storeUpdate.has(value)) {
        for (const key in value) {
          if (key !== 'query' && key !== 'variables') {
            throw new TypeError(
              'It is not allowed to update result properties on an OperationStore .'
            );
          }
        }
      }
    }

    for (const key in value) {
      if (key === 'query') {
        query = value.query!;
      } else if (key === 'variables') {
        variables = value.variables as Vars;
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

    ['stale', 'fetching', 'data', 'error', 'extensions'].forEach(prop => {
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
    });
  }

  Object.defineProperty(result, 'query', {
    configurable: false,
    get: () => query,
    set(newQuery) {
      query = newQuery;
      if (!_internalUpdate) invalidate();
    },
  });

  Object.defineProperty(result, 'variables', {
    configurable: false,
    get: () => variables,
    set(newVariables) {
      variables = newVariables;
      if (!_internalUpdate) invalidate();
    },
  });

  return result as OperationStore<Data, Vars>;
}
