import { renderHook, testEffect } from '@solidjs/testing-library';
import {
  OperationResult,
  OperationResultSource,
  createClient,
  createRequest,
  gql,
} from '@urql/core';
import { expect, it, describe, vi } from 'vitest';
import { makeSubject } from 'wonka';
import {
  CreateSubscriptionState,
  createSubscription,
} from './createSubscription';
import { createEffect, createSignal } from 'solid-js';

const QUERY = gql`
  subscription {
    value
  }
`;

const client = createClient({
  url: '/graphql',
  exchanges: [],
  suspense: false,
});

vi.mock('./context', () => {
  const useClient = () => {
    return client!;
  };

  return { useClient };
});

// Given that it is not possible to directly listen to all store changes it is necessary
// to access all relevant parts on which `createEffect` should listen on
const markStateDependencies = (state: CreateSubscriptionState<any, any>) => {
  state.data;
  state.error;
  state.extensions;
  state.fetching;
  state.operation;
  state.stale;
};

describe('createSubscription', () => {
  it('should receive data', () => {
    return testEffect(done => {
      const subject =
        makeSubject<Pick<OperationResult<{ value: number }, any>, 'data'>>();
      const executeQuery = vi
        .spyOn(client, 'executeSubscription')
        .mockImplementation(
          () => subject.source as OperationResultSource<OperationResult>
        );

      const request = createRequest(QUERY, undefined);
      const operation = client.createRequestOperation('subscription', request);

      const [state] = createSubscription<
        { value: number },
        { value: number },
        { variable: number }
      >({
        query: QUERY,
      });

      createEffect((run: number = 0) => {
        markStateDependencies(state);

        switch (run) {
          case 0: {
            expect(state).toMatchObject({
              data: undefined,
              stale: false,
              operation: operation,
              error: undefined,
              extensions: undefined,
              fetching: true,
            });
            expect(executeQuery).toEqual(expect.any(Function));
            expect(executeQuery).toHaveBeenCalledOnce();
            expect(client.executeSubscription).toBeCalledWith(
              {
                key: expect.any(Number),
                query: expect.any(Object),
                variables: {},
              },
              undefined
            );
            subject.next({ data: { value: 0 } });
            break;
          }
          case 1: {
            expect(state.data).toEqual({ value: 0 });
            subject.next({ data: { value: 1 } });
            break;
          }
          case 2: {
            expect(state.data).toEqual({ value: 1 });
            // expect(state.fetching).toEqual(true);
            subject.complete();
            break;
          }
          case 3: {
            expect(state.fetching).toEqual(false);
            expect(state.data).toEqual({ value: 1 });
            done();
          }
        }

        return run + 1;
      });
    });
  });

  it('should call handler', () => {
    const handler = vi.fn();
    const subject =
      makeSubject<Pick<OperationResult<{ value: number }, any>, 'data'>>();
    vi.spyOn(client, 'executeSubscription').mockImplementation(
      () => subject.source as OperationResultSource<OperationResult>
    );

    return testEffect(done => {
      const [state] = createSubscription<
        { value: number },
        { value: number },
        { variable: number }
      >(
        {
          query: QUERY,
        },
        handler
      );

      createEffect((run: number = 0) => {
        markStateDependencies(state);
        switch (run) {
          case 0: {
            expect(state.fetching).toEqual(true);
            subject.next({ data: { value: 0 } });

            break;
          }
          case 1: {
            expect(handler).toHaveBeenCalledOnce();
            expect(handler).toBeCalledWith(undefined, { value: 0 });
            done();
            break;
          }
        }

        return run + 1;
      });
    });
  });

  it('should unsubscribe on teardown', async () => {
    const subject =
      makeSubject<Pick<OperationResult<{ value: number }, any>, 'data'>>();
    vi.spyOn(client, 'executeSubscription').mockImplementation(
      () => subject.source as OperationResultSource<OperationResult>
    );

    const {
      result: [state],
      cleanup,
    } = renderHook(() =>
      createSubscription<{ value: number }, { variable: number }>({
        query: QUERY,
      })
    );

    return testEffect(done =>
      createEffect((run: number = 0) => {
        if (run === 0) {
          expect(state.fetching).toEqual(true);
          cleanup();
        }

        if (run === 1) {
          expect(state.fetching).toEqual(false);
          done();
        }

        return run + 1;
      })
    );
  });

  it('should skip executing query when paused', async () => {
    const subject =
      makeSubject<Pick<OperationResult<{ value: number }, any>, 'data'>>();
    vi.spyOn(client, 'executeSubscription').mockImplementation(
      () => subject.source as OperationResultSource<OperationResult>
    );

    return testEffect(done => {
      const [pause, setPause] = createSignal<boolean>(true);

      const [state] = createSubscription<
        { value: number },
        { value: number },
        { variable: number }
      >({ query: QUERY, pause: pause });

      createEffect((run: number = 0) => {
        switch (run) {
          case 0: {
            expect(state.fetching).toBe(false);
            setPause(false);
            break;
          }
          case 1: {
            expect(state.fetching).toBe(true);
            expect(state.data).toBeUndefined();
            subject.next({ data: { value: 1 } });

            break;
          }
          case 2: {
            expect(state.data).toStrictEqual({ value: 1 });
            done();
            break;
          }
        }

        return run + 1;
      });
    });
  });

  it('should override pause when execute executeSubscription', () => {
    const subject =
      makeSubject<Pick<OperationResult<{ value: number }, any>, 'data'>>();
    const executeQuery = vi
      .spyOn(client, 'executeSubscription')
      .mockImplementation(
        () => subject.source as OperationResultSource<OperationResult>
      );

    return testEffect(done => {
      const [state, executeSubscription] = createSubscription<
        { value: number },
        { value: number },
        { variable: number }
      >({
        query: QUERY,
        pause: true,
      });

      createEffect((run: number = 0) => {
        markStateDependencies(state);

        switch (run) {
          case 0: {
            expect(state.fetching).toEqual(false);
            expect(executeQuery).not.toBeCalled();

            executeSubscription();

            break;
          }
          case 1: {
            expect(state.fetching).toEqual(true);
            expect(executeQuery).toHaveBeenCalledOnce();
            subject.next({ data: { value: 1 } });
            break;
          }
          case 2: {
            expect(state.data).toStrictEqual({ value: 1 });
            done();
            break;
          }
        }

        return run + 1;
      });
    });
  });

  it.only('should aggregate results', () => {
    const subject =
      makeSubject<Pick<OperationResult<{ value: number }, any>, 'data'>>();
    vi.spyOn(client, 'executeSubscription').mockImplementation(
      () => subject.source as OperationResultSource<OperationResult>
    );

    return testEffect(done => {
      const [state] = createSubscription<
        { value: number },
        { merged: number },
        { variable: number }
      >(
        {
          query: QUERY,
        },
        (prev, next) => {
          if (prev === undefined) {
            return {
              merged: 0 + next.value,
            };
          }

          return { merged: prev.merged + next.value };
        }
      );

      createEffect((run: number = 0) => {
        markStateDependencies(state);
        switch (run) {
          case 0: {
            expect(state.fetching).toEqual(true);
            subject.next({ data: { value: 1 } });

            break;
          }
          case 1: {
            expect(state.data).toEqual({ merged: 1 });
            subject.next({ data: { value: 2 } });

            break;
          }
          case 2: {
            expect(state.data).toEqual({ merged: 3 });

            done();
            break;
          }
        }

        return run + 1;
      });
    });
  });
});
