import { reactive, ref } from 'vue';

jest.mock('./useClient.ts', () => ({
  __esModule: true,
  ...jest.requireActual('./useClient.ts'),
  useClient: () => ref(client),
}));

import { makeSubject } from 'wonka';
import { createClient, gql } from '@urql/core';
import { useMutation } from './useMutation';

const client = createClient({ url: '/graphql', exchanges: [] });

beforeEach(() => {
  jest.resetAllMocks();
});

describe('useMutation', () => {
  it('provides an execute method that resolves a promise', done => {
    const subject = makeSubject<any>();
    const clientMutation = jest
      .spyOn(client, 'executeMutation')
      .mockImplementation(() => subject.source);

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
    promise.then(function () {
      expect(mutation.fetching).toBe(false);
      expect(mutation.stale).toBe(false);
      expect(mutation.error).toBe(undefined);
      expect(mutation.data).toEqual({ test: true });
      done();
    });
  });
});
