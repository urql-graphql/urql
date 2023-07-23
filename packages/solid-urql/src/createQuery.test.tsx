import { expect, it, describe, vi } from 'vitest';
import { createQuery } from './createQuery';
import { render, renderHook, waitFor } from '@solidjs/testing-library';
import { createClient } from '@urql/core';
import { Show, Suspense, createSignal } from 'solid-js';
import { makeSubject } from 'wonka';
import { OperationResult, OperationResultSource } from '@urql/core';
import '@testing-library/jest-dom';

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

type AppProps = {
  suspense?: boolean;
};
const App = (props: AppProps) => {
  const [resource, refetch] = createQuery<
    { test: boolean },
    { variable: number }
  >({
    query: '{ test }',
    context: {
      suspense: props.suspense,
    },
  });

  return (
    <Suspense fallback={<span data-testid="loading">loading</span>}>
      <Show when={resource.data}>
        {data => <span data-testid="value">{data().test}</span>}
      </Show>
      <button
        data-testid="refetch"
        onClick={() => refetch({ variables: { variable: 1 } })}
      >
        refetch
      </button>
    </Suspense>
  );
};

describe('createQuery', () => {
  it('should not suspend', async () => {
    const subject =
      makeSubject<Pick<OperationResult<{ test: boolean }, any>, 'data'>>();
    vi.spyOn(client, 'executeQuery').mockImplementation(
      () => subject.source as OperationResultSource<OperationResult>
    );

    const { findByTestId } = render(() => <App suspense={false} />);

    subject.next({ data: { test: true } });
    waitFor(async () =>
      expect((await findByTestId('value')).innerText).toStrictEqual('true')
    );

    const refetch = await findByTestId('refetch');
    refetch.click();

    subject.next({ data: { test: true } });
    waitFor(async () =>
      expect((await findByTestId('value')).innerText).toStrictEqual('true')
    );
  });

  it('should suspend', async () => {
    const subject =
      makeSubject<Pick<OperationResult<{ test: boolean }, any>, 'data'>>();
    vi.spyOn(client, 'executeQuery').mockImplementation(
      () => subject.source as OperationResultSource<OperationResult>
    );

    const { findByTestId } = render(() => <App suspense={true} />);

    expect(await findByTestId('loading')).not.toBeFalsy();
    subject.next({ data: { test: true } });
    expect(await findByTestId('value')).not.toBeFalsy();

    const refetch = await findByTestId('refetch');
    refetch.click();

    expect(await findByTestId('loading')).not.toBeFalsy();
    subject.next({ data: { test: true } });
    expect(await findByTestId('value')).not.toBeFalsy();
  });

  it('should not refetch when paused on variable change', async () => {
    const subject =
      makeSubject<Pick<OperationResult<{ test: boolean }, any>, 'data'>>();
    const executeQuery = vi
      .spyOn(client, 'executeQuery')
      .mockImplementation(
        () => subject.source as OperationResultSource<OperationResult>
      );

    const [variable, setVariable] = createSignal(1);
    const [pause, setPause] = createSignal(false);

    const { result } = renderHook(() =>
      createQuery<{ variable: number }>({
        query: '{ test }',
        pause: pause,
        variables: () => ({
          variable: variable(),
        }),
      })
    );

    expect(result[0].fetching).toEqual(true);
    subject.next({ data: { test: true } });
    expect(result[0].fetching).toEqual(false);

    setVariable(2);

    expect(result[0].fetching).toEqual(true);
    subject.next({ data: { test: true } });
    expect(result[0].fetching).toEqual(false);

    expect(executeQuery).toHaveBeenCalledTimes(2);

    setPause(true);
    setVariable(3);

    expect(result[0].fetching).toEqual(false);
    expect(executeQuery).toHaveBeenCalledTimes(2);
  });

  it('should override pause when execute via refetch', async () => {
    const subject =
      makeSubject<Pick<OperationResult<{ test: boolean }, any>, 'data'>>();
    const executeQuery = vi
      .spyOn(client, 'executeQuery')
      .mockImplementation(
        () => subject.source as OperationResultSource<OperationResult>
      );

    const { result } = renderHook(() =>
      createQuery<{ variable: number }>({
        query: '{ test }',
        pause: true,
      })
    );

    expect(result[0].fetching).toEqual(false);
    expect(executeQuery).not.toBeCalled();

    result[1]();

    expect(result[0].fetching).toEqual(true);
    expect(executeQuery).toHaveBeenCalledOnce();
    subject.next({ data: { test: true } });

    expect(result[0].fetching).toEqual(false);
    expect(result[0].data).toStrictEqual({ test: true });
  });

  it('should trigger refetch on variables change', async () => {
    const subject =
      makeSubject<Pick<OperationResult<{ test: boolean }, any>, 'data'>>();
    const executeQuery = vi
      .spyOn(client, 'executeQuery')
      .mockImplementation(
        () => subject.source as OperationResultSource<OperationResult>
      );

    const [variables, setVariables] = createSignal<{ variable: number }>({
      variable: 1,
    });

    const { result } = renderHook(() =>
      createQuery<{ test: boolean }, { variable: number }>({
        query: '{ test }',
        variables: variables,
      })
    );

    expect(result[0].fetching).toEqual(true);
    subject.next({ data: { test: true } });
    expect(result[0].fetching).toEqual(false);
    expect(result[0].data?.test).toEqual(true);
    setVariables({ variable: 2 });

    expect(result[0].fetching).toEqual(true);
    expect(executeQuery).toHaveBeenCalledTimes(2);

    subject.next({ data: { test: false } });
    expect(result[0].fetching).toEqual(false);
    expect(result[0].data?.test).toEqual(false);
  });

  it('should receive data', async () => {
    const subject =
      makeSubject<Pick<OperationResult<{ test: boolean }, any>, 'data'>>();
    const executeQuery = vi
      .spyOn(client, 'executeQuery')
      .mockImplementation(
        () => subject.source as OperationResultSource<OperationResult>
      );

    const { result } = renderHook(() =>
      createQuery<{ variable: number }, { test: boolean }>({
        query: '{ test }',
      })
    );

    expect(result[0].fetching).toEqual(true);
    expect(result[0].data).toBeUndefined();

    subject.next({ data: { test: true } });

    expect(result[0].fetching).toEqual(false);
    expect(result[0].data).toStrictEqual({ test: true });
    expect(executeQuery).toHaveBeenCalledTimes(1);
  });

  it('should unsubscribe on teardown', async () => {
    const subject =
      makeSubject<Pick<OperationResult<{ value: number }, any>, 'data'>>();
    vi.spyOn(client, 'executeQuery').mockImplementation(
      () => subject.source as OperationResultSource<OperationResult>
    );

    const { result, cleanup } = renderHook(() =>
      createQuery<{ value: number }, { variable: number }>({
        query: '{ test }',
      })
    );

    cleanup();
    waitFor(() => expect(result[0].fetching).toEqual(false));
  });
});
