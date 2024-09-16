import { pipe, map, fromValue, toPromise, take } from 'wonka';
import { vi, expect, it, beforeEach } from 'vitest';
import { GraphQLError } from 'graphql';

import {
  gql,
  createClient,
  Operation,
  ExchangeIO,
  Client,
  CombinedError,
} from '@urql/core';

import { throwOnErrorExchange } from './throwOnErrorExchange';

const dispatchDebug = vi.fn();

const query = gql`
  {
    topLevel
    topLevelList
    object {
      inner
    }
    objectList {
      inner
    }
  }
`;
const mockData = {
  topLevel: 'topLevel',
  topLevelList: ['topLevelList'],
  object: { inner: 'inner' },
  objectList: [{ inner: 'inner' }],
};

let client: Client, op: Operation;
beforeEach(() => {
  client = createClient({
    url: 'http://0.0.0.0',
    exchanges: [],
  });
  op = client.createRequestOperation('query', { key: 1, query, variables: {} });
});

it('throws on top level field error', async () => {
  const forward: ExchangeIO = ops$ =>
    pipe(
      ops$,
      map(
        operation =>
          ({
            operation,
            data: {
              ...mockData,
              topLevel: null,
            },
            error: new CombinedError({
              graphQLErrors: [
                new GraphQLError('top level error', { path: ['topLevel'] }),
              ],
            }),
          }) as any
      )
    );

  const res = await pipe(
    fromValue(op),
    throwOnErrorExchange()({ forward, client, dispatchDebug }),
    take(1),
    toPromise
  );

  expect(() => res.data?.topLevel).toThrow('top level error');
  expect(() => res.data).not.toThrow();
  expect(() => res.data?.topLevelList[0]).not.toThrow();
});

it('throws on top level list element error', async () => {
  const forward: ExchangeIO = ops$ =>
    pipe(
      ops$,
      map(
        operation =>
          ({
            operation,
            data: {
              ...mockData,
              topLevelList: ['topLevelList', null],
            },
            error: new CombinedError({
              graphQLErrors: [
                new GraphQLError('top level list error', {
                  path: ['topLevelList', 1],
                }),
              ],
            }),
          }) as any
      )
    );

  const res = await pipe(
    fromValue(op),
    throwOnErrorExchange()({ forward, client, dispatchDebug }),
    take(1),
    toPromise
  );

  expect(() => res.data?.topLevelList[1]).toThrow('top level list error');
  expect(() => res.data).not.toThrow();
  expect(() => res.data?.topLevelList[0]).not.toThrow();
});

it('throws on object field error', async () => {
  const forward: ExchangeIO = ops$ =>
    pipe(
      ops$,
      map(
        operation =>
          ({
            operation,
            data: {
              ...mockData,
              object: null,
            },
            error: new CombinedError({
              graphQLErrors: [
                new GraphQLError('object field error', { path: ['object'] }),
              ],
            }),
          }) as any
      )
    );

  const res = await pipe(
    fromValue(op),
    throwOnErrorExchange()({ forward, client, dispatchDebug }),
    take(1),
    toPromise
  );

  expect(() => res.data?.object).toThrow('object field error');
  expect(() => res.data?.object.inner).toThrow('object field error');
  expect(() => res.data).not.toThrow();
  expect(() => res.data?.topLevel).not.toThrow();
});

it('throws on object inner field error', async () => {
  const forward: ExchangeIO = ops$ =>
    pipe(
      ops$,
      map(
        operation =>
          ({
            operation,
            data: {
              ...mockData,
              object: {
                inner: null,
              },
            },
            error: new CombinedError({
              graphQLErrors: [
                new GraphQLError('object inner field error', {
                  path: ['object', 'inner'],
                }),
              ],
            }),
          }) as any
      )
    );

  const res = await pipe(
    fromValue(op),
    throwOnErrorExchange()({ forward, client, dispatchDebug }),
    take(1),
    toPromise
  );

  expect(() => res.data?.object.inner).toThrow('object inner field error');
  expect(() => res.data).not.toThrow();
  expect(() => res.data?.object).not.toThrow();
});

it('throws on object list field error', async () => {
  const forward: ExchangeIO = ops$ =>
    pipe(
      ops$,
      map(
        operation =>
          ({
            operation,
            data: {
              ...mockData,
              objectList: null,
            },
            error: new CombinedError({
              graphQLErrors: [
                new GraphQLError('object list field error', {
                  path: ['objectList'],
                }),
              ],
            }),
          }) as any
      )
    );

  const res = await pipe(
    fromValue(op),
    throwOnErrorExchange()({ forward, client, dispatchDebug }),
    take(1),
    toPromise
  );

  expect(() => res.data?.objectList).toThrow('object list field error');
  expect(() => res.data?.objectList[0]).toThrow('object list field error');
  expect(() => res.data?.objectList[0].inner).toThrow(
    'object list field error'
  );
  expect(() => res.data).not.toThrow();
  expect(() => res.data?.topLevel).not.toThrow();
});

it('throws on object inner field error', async () => {
  const forward: ExchangeIO = ops$ =>
    pipe(
      ops$,
      map(
        operation =>
          ({
            operation,
            data: {
              ...mockData,
              objectList: [{ inner: 'inner' }, { inner: null }],
            },
            error: new CombinedError({
              graphQLErrors: [
                new GraphQLError('object list inner field error', {
                  path: ['objectList', 1, 'inner'],
                }),
              ],
            }),
          }) as any
      )
    );

  const res = await pipe(
    fromValue(op),
    throwOnErrorExchange()({ forward, client, dispatchDebug }),
    take(1),
    toPromise
  );

  expect(() => res.data?.objectList[1].inner).toThrow(
    'object list inner field error'
  );
  expect(() => res.data).not.toThrow();
  expect(() => res.data?.objectList[0].inner).not.toThrow();
});
