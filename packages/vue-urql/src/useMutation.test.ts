jest.mock('./useClient.ts', () => ({
  __esModule: true,
  ...jest.requireActual('./useClient.ts'),
  useClient: () => client,
}));

import { makeSubject, pipe, take, toPromise } from 'wonka';
import { createClient, gql } from '@urql/core';
import { useMutation } from './useMutation';
import { reactive } from 'vue';

const client = createClient({ url: '/graphql', exchanges: [] });

beforeEach(() => {
  jest.resetAllMocks();
});

describe('useMutation', () => {
  it('provides an execute method that resolves a promise', async () => {
    const subject = makeSubject<any>();
    const clientMutation = jest
      .spyOn(client, 'executeMutation')
      .mockImplementation((): any => ({
        toPromise() {
          return pipe(subject.source, take(1), toPromise);
        },
      }));
    const mutation = reactive(
      useMutation(
        gql`
          mutation {
            test
          }
        `
      )
    );

    expect(mutation).toMatchObject({
      data: undefined,
      stale: false,
      fetching: false,
      error: undefined,
      extensions: undefined,
      operation: undefined,
      executeMutation: expect.any(Function),
    });

    const promise = mutation.executeMutation({ test: true });

    expect(mutation.fetching).toBe(true);
    expect(mutation.stale).toBe(false);
    expect(mutation.error).toBe(undefined);

    expect(clientMutation).toHaveBeenCalledTimes(1);

    subject.next({ data: { test: true } });

    await promise;

    expect(mutation.fetching).toBe(false);
    expect(mutation.stale).toBe(false);
    expect(mutation.error).toBe(undefined);
    expect(mutation.data).toEqual({ test: true });
  });
});
