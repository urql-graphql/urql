import { describe, it, expect } from 'vitest';

import { gql } from '../gql';
import { createRequest } from './request';
import {
  isDeferredPromise,
  makeDeferredState,
  resolveDeferredState,
  updateDeferredResult,
} from './defer';

const query = gql`
  query {
    todo {
      id
      __typename
      ... on Todo @defer {
        name
      }
    }
  }
`;

const makeResult = (data: any, hasNext: boolean): any => ({
  operation: {} as any,
  data,
  stale: false,
  hasNext,
});

describe('isDeferredPromise', () => {
  it('only matches tagged deferred promises', () => {
    expect(isDeferredPromise(Promise.resolve())).toBe(false);
    expect(isDeferredPromise({ then: () => {} })).toBe(false);
    expect(isDeferredPromise(null)).toBe(false);
    const tagged = Object.assign(Promise.resolve(), { _urqlDeferred: true });
    expect(isDeferredPromise(tagged)).toBe(true);
  });
});

describe('updateDeferredResult', () => {
  it('installs a stable promise for a missing deferred field while streaming', () => {
    const request = createRequest(query, {});
    const state = makeDeferredState();

    const result = updateDeferredResult(
      request,
      makeResult({ todo: { id: '1', __typename: 'Todo' } }, true),
      state
    );

    const pending = (result.data as any).todo.name;
    expect(isDeferredPromise(pending)).toBe(true);
    expect(pending._resolved).toBe(false);
    expect(state.promises.size).toBe(1);
  });

  it('resolves the same promise with the streamed-in value as patches arrive', () => {
    const request = createRequest(query, {});
    const state = makeDeferredState();

    const first = updateDeferredResult(
      request,
      makeResult({ todo: { id: '1', __typename: 'Todo' } }, true),
      state
    );
    const pending = (first.data as any).todo.name;

    updateDeferredResult(
      request,
      makeResult(
        { todo: { id: '1', __typename: 'Todo', name: 'Hello' } },
        false
      ),
      state
    );

    expect(pending._resolved).toBe(true);
    expect(pending._value).toBe('Hello');
    // Resolved promises are removed from the state.
    expect(state.promises.size).toBe(0);
  });

  it('does not install a promise once the stream has ended', () => {
    const request = createRequest(query, {});
    const state = makeDeferredState();

    const result = updateDeferredResult(
      request,
      makeResult({ todo: { id: '1', __typename: 'Todo' } }, false),
      state
    );

    expect((result.data as any).todo.name).toBeUndefined();
    expect(state.promises.size).toBe(0);
  });

  it('resolves all remaining promises when the stream ends', () => {
    const request = createRequest(query, {});
    const state = makeDeferredState();

    const first = updateDeferredResult(
      request,
      makeResult({ todo: { id: '1', __typename: 'Todo' } }, true),
      state
    );
    const pending = (first.data as any).todo.name;
    expect(pending._resolved).toBe(false);

    updateDeferredResult(
      request,
      makeResult({ todo: { id: '1', __typename: 'Todo' } }, false),
      state
    );

    expect(pending._resolved).toBe(true);
    expect(state.promises.size).toBe(0);
  });
});

describe('resolveDeferredState', () => {
  it('resolves and clears every pending promise', () => {
    const request = createRequest(query, {});
    const state = makeDeferredState();

    const first = updateDeferredResult(
      request,
      makeResult({ todo: { id: '1', __typename: 'Todo' } }, true),
      state
    );
    const pending = (first.data as any).todo.name;

    resolveDeferredState(state);

    expect(pending._resolved).toBe(true);
    expect(state.promises.size).toBe(0);
  });
});
