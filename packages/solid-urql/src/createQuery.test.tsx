import { expect, it, describe, vi } from 'vitest';
import { CreateQueryState, createQuery } from './createQuery';
import { renderHook, testEffect } from '@solidjs/testing-library';
import { createClient } from '@urql/core';
import { createEffect, createSignal } from 'solid-js';
import { makeSubject } from 'wonka';
import { OperationResult, OperationResultSource } from '@urql/core';

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
const markStateDependencies = (state: CreateQueryState<any, any>) => {
  state.data;
  state.error;
  state.extensions;
  state.fetching;
  state.operation;
  state.stale;
};

describe('createQuery', () => {
  it('should fetch when query is resumed', () => {
    const subject =
      makeSubject<Pick<OperationResult<{ test: boolean }, any>, 'data'>>();
    const executeQuery = vi
      .spyOn(client, 'executeQuery')
      .mockImplementation(
        () => subject.source as OperationResultSource<OperationResult>
      );

    return testEffect(done => {
      const [pause, setPause] = createSignal<boolean>(true);
      const [state] = createQuery<{ test: boolean }, { variable: number }>({
        query: '{ test }',
        pause: pause,
      });

      createEffect((run: number = 0) => {
        markStateDependencies(state);

        switch (run) {
          case 0: {
            expect(state.fetching).toEqual(false);
            expect(executeQuery).not.toHaveBeenCalled();
            setPause(false);
            break;
          }
          case 1: {
            expect(state.fetching).toEqual(true);
            expect(executeQuery).toHaveBeenCalledOnce();
            subject.next({ data: { test: true } });
            break;
          }
          case 2: {
            expect(state.fetching).toEqual(false);
            expect(state.data).toStrictEqual({ test: true });
            done();
            break;
          }
        }

        return run + 1;
      });
    });
  });

  it('should override pause when execute via refetch', () => {
    const subject =
      makeSubject<Pick<OperationResult<{ test: boolean }, any>, 'data'>>();
    const executeQuery = vi
      .spyOn(client, 'executeQuery')
      .mockImplementation(
        () => subject.source as OperationResultSource<OperationResult>
      );

    return testEffect(done => {
      const [state, refetch] = createQuery<
        { test: boolean },
        { variable: number }
      >({
        query: '{ test }',
        pause: true,
      });

      createEffect((run: number = 0) => {
        markStateDependencies(state);

        switch (run) {
          case 0: {
            expect(state.fetching).toEqual(false);
            expect(executeQuery).not.toBeCalled();
            refetch();
            break;
          }
          case 1: {
            expect(state.fetching).toEqual(true);
            expect(executeQuery).toHaveBeenCalledOnce();
            subject.next({ data: { test: true } });
            break;
          }
          case 2: {
            expect(state.fetching).toEqual(false);
            expect(state.data).toStrictEqual({ test: true });
            done();
            break;
          }
        }

        return run + 1;
      });
    });
  });

  it('should trigger refetch on variables change', () => {
    const subject =
      makeSubject<Pick<OperationResult<{ test: boolean }, any>, 'data'>>();
    const executeQuery = vi
      .spyOn(client, 'executeQuery')
      .mockImplementation(
        () => subject.source as OperationResultSource<OperationResult>
      );

    return testEffect(done => {
      const [variables, setVariables] = createSignal<{ variable: number }>({
        variable: 1,
      });

      const [state] = createQuery<{ test: boolean }, { variable: number }>({
        query: '{ test }',
        variables: variables,
      });

      createEffect((run: number = 0) => {
        markStateDependencies(state);

        switch (run) {
          case 0: {
            expect(state.fetching).toEqual(true);

            subject.next({ data: { test: true } });

            break;
          }
          case 1: {
            expect(state.fetching).toEqual(false);
            expect(state.data).toEqual({ test: true });
            setVariables({ variable: 2 });
            break;
          }
          case 2: {
            expect(state.fetching).toEqual(true);
            expect(executeQuery).toHaveBeenCalledTimes(2);

            subject.next({ data: { test: false } });
            break;
          }
          case 3: {
            expect(state.fetching).toEqual(false);
            expect(state.data).toEqual({ test: false });
            done();
            break;
          }
        }

        return run + 1;
      });
    });
  });

  it('should receive data', () => {
    const subject =
      makeSubject<Pick<OperationResult<{ test: boolean }, any>, 'data'>>();
    const executeQuery = vi
      .spyOn(client, 'executeQuery')
      .mockImplementation(
        () => subject.source as OperationResultSource<OperationResult>
      );

    return testEffect(done => {
      const [state] = createQuery<{ test: boolean }, { variable: number }>({
        query: '{ test }',
      });

      createEffect((run: number = 0) => {
        markStateDependencies(state);

        switch (run) {
          case 0: {
            expect(state.fetching).toEqual(true);
            expect(state.data).toBeUndefined();

            subject.next({ data: { test: true } });
            break;
          }

          case 1: {
            expect(state.fetching).toEqual(false);
            expect(state.data).toStrictEqual({ test: true });
            expect(executeQuery).toHaveBeenCalledTimes(1);
            done();
            break;
          }
        }

        return run + 1;
      });
    });
  });

  it('should unsubscribe on teardown', () => {
    const subject =
      makeSubject<Pick<OperationResult<{ value: number }, any>, 'data'>>();
    vi.spyOn(client, 'executeQuery').mockImplementation(
      () => subject.source as OperationResultSource<OperationResult>
    );

    const {
      result: [state],
      cleanup,
    } = renderHook(() =>
      createQuery<{ test: number }, { variable: number }>({
        query: '{ test }',
      })
    );

    return testEffect(done => {
      markStateDependencies(state);

      createEffect((run: number = 0) => {
        switch (run) {
          case 0: {
            expect(state.fetching).toEqual(true);
            cleanup();
            break;
          }
          case 1: {
            expect(state.fetching).toEqual(false);
            done();
            break;
          }
        }

        return run + 1;
      });
    });
  });
});
