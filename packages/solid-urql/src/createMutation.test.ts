import { testEffect } from '@solidjs/testing-library';
import { expect, it, describe, vi } from 'vitest';
import { CreateMutationState, createMutation } from './createMutation';
import {
  OperationResult,
  OperationResultSource,
  createClient,
  gql,
} from '@urql/core';
import { makeSubject } from 'wonka';
import { createEffect } from 'solid-js';

const QUERY = gql`
  mutation {
    test
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
const markStateDependencies = (state: CreateMutationState<any, any>) => {
  state.data;
  state.error;
  state.extensions;
  state.fetching;
  state.operation;
  state.stale;
};

describe('createMutation', () => {
  it('should have expected state before and after finish', () => {
    const subject = makeSubject<any>();
    const clientMutation = vi
      .spyOn(client, 'executeMutation')
      .mockImplementation(
        () => subject.source as OperationResultSource<OperationResult>
      );

    return testEffect(done => {
      const [state, execute] = createMutation<
        { test: boolean },
        { variable: number }
      >(QUERY);

      createEffect((run: number = 0) => {
        markStateDependencies(state);

        switch (run) {
          case 0: {
            expect(state).toMatchObject({
              data: undefined,
              stale: false,
              fetching: false,
              error: undefined,
              extensions: undefined,
              operation: undefined,
            });

            execute({ variable: 1 });
            break;
          }

          case 1: {
            expect(state).toMatchObject({
              data: undefined,
              stale: false,
              fetching: true,
              error: undefined,
              extensions: undefined,
              operation: undefined,
            });

            expect(clientMutation).toHaveBeenCalledTimes(1);
            subject.next({ data: { test: true }, stale: false });

            break;
          }

          case 2: {
            expect(state).toMatchObject({
              data: { test: true },
              stale: false,
              fetching: false,
              error: undefined,
              extensions: undefined,
            });

            done();
            break;
          }
        }

        return run + 1;
      });
    });
  });
});
