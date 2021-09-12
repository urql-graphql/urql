import { pipe, scan, subscribe, toPromise } from 'wonka';

import { queryOperation, context } from '../test-utils';
import { makeFetchSource } from './fetchSource';
import { gql } from '../gql';
import { OperationResult, Operation } from '../types';
import { makeOperation } from '../utils';

const fetch = (global as any).fetch as jest.Mock;
const abort = jest.fn();

const abortError = new Error();
abortError.name = 'AbortError';

beforeAll(() => {
  (global as any).AbortController = function AbortController() {
    this.signal = undefined;
    this.abort = abort;
  };
});

beforeEach(() => {
  fetch.mockClear();
  abort.mockClear();
});

afterAll(() => {
  (global as any).AbortController = undefined;
});

const response = {
  status: 200,
  data: {
    data: {
      user: 1200,
    },
  },
};

describe('on success', () => {
  beforeEach(() => {
    fetch.mockResolvedValue({
      status: 200,
      json: jest.fn().mockResolvedValue(response),
    });
  });

  it('returns response data', async () => {
    const fetchOptions = {};
    const data = await pipe(
      makeFetchSource(queryOperation, 'https://test.com/graphql', fetchOptions),
      toPromise
    );

    expect(data).toMatchSnapshot();

    expect(fetch).toHaveBeenCalled();
    expect(fetch.mock.calls[0][0]).toBe('https://test.com/graphql');
    expect(fetch.mock.calls[0][1]).toBe(fetchOptions);
  });

  it('uses the mock fetch if given', async () => {
    const fetchOptions = {};
    const fetcher = jest.fn().mockResolvedValue({
      status: 200,
      json: jest.fn().mockResolvedValue(response),
    });

    const data = await pipe(
      makeFetchSource(
        {
          ...queryOperation,
          context: {
            ...queryOperation.context,
            fetch: fetcher,
          },
        },
        'https://test.com/graphql',
        fetchOptions
      ),
      toPromise
    );

    expect(data).toMatchSnapshot();
    expect(fetch).not.toHaveBeenCalled();
    expect(fetcher).toHaveBeenCalled();
  });
});

describe('on error', () => {
  beforeEach(() => {
    fetch.mockResolvedValue({
      status: 400,
      json: jest.fn().mockResolvedValue({}),
    });
  });

  it('returns error data', async () => {
    const fetchOptions = {};
    const data = await pipe(
      makeFetchSource(queryOperation, 'https://test.com/graphql', fetchOptions),
      toPromise
    );

    expect(data).toMatchSnapshot();
  });

  it('returns error data with status 400 and manual redirect mode', async () => {
    const data = await pipe(
      makeFetchSource(queryOperation, 'https://test.com/graphql', {
        redirect: 'manual',
      }),
      toPromise
    );

    expect(data).toMatchSnapshot();
  });

  it('ignores the error when a result is available', async () => {
    const data = await pipe(
      makeFetchSource(queryOperation, 'https://test.com/graphql', {}),
      toPromise
    );

    expect(data).toMatchSnapshot();
  });
});

describe('on teardown', () => {
  it('does not start the outgoing request on immediate teardowns', () => {
    fetch.mockRejectedValue(abortError);

    const { unsubscribe } = pipe(
      makeFetchSource(queryOperation, 'https://test.com/graphql', {}),
      subscribe(fail)
    );

    unsubscribe();
    expect(fetch).toHaveBeenCalledTimes(0);
    expect(abort).toHaveBeenCalledTimes(1);
  });

  it('aborts the outgoing request', async () => {
    fetch.mockRejectedValue(abortError);

    const { unsubscribe } = pipe(
      makeFetchSource(queryOperation, 'https://test.com/graphql', {}),
      subscribe(fail)
    );

    await Promise.resolve();

    unsubscribe();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(abort).toHaveBeenCalledTimes(1);
  });
});

describe('on multipart/mixed', () => {
  const wrap = (json: object) =>
    '\r\n' +
    'Content-Type: application/json; charset=utf-8\r\n\r\n' +
    JSON.stringify(json) +
    '\r\n---';

  it('listens for more responses (stream)', async () => {
    fetch.mockResolvedValue({
      status: 200,
      headers: {
        get() {
          return 'multipart/mixed';
        },
      },
      body: {
        getReader: function () {
          let cancelled = false;
          const results = [
            {
              done: false,
              value: Buffer.from('\r\n---'),
            },
            {
              done: false,
              value: Buffer.from(
                wrap({
                  hasNext: true,
                  data: {
                    author: {
                      id: '1',
                      name: 'Steve',
                      __typename: 'Author',
                      todos: [{ id: '1', text: 'stream', __typename: 'Todo' }],
                    },
                  },
                })
              ),
            },
            {
              done: false,
              value: Buffer.from(
                wrap({
                  path: ['author', 'todos', 1],
                  data: { id: '2', text: 'defer', __typename: 'Todo' },
                  hasNext: true,
                })
              ),
            },
            {
              done: false,
              value: Buffer.from(wrap({ hasNext: false }) + '--'),
            },
            { done: true },
          ];
          let count = 0;
          return {
            cancel: function () {
              cancelled = true;
            },
            read: function () {
              if (cancelled) throw new Error('No');

              return Promise.resolve(results[count++]);
            },
          };
        },
      },
    });

    const streamedQueryOperation: Operation = makeOperation(
      'query',
      {
        query: gql`
          query {
            author {
              id
              name
              todos @stream {
                id
                text
              }
            }
          }
        `,
        variables: {},
        key: 1,
      },
      context
    );

    const chunks: OperationResult[] = await pipe(
      makeFetchSource(streamedQueryOperation, 'https://test.com/graphql', {}),
      scan((prev: OperationResult[], item) => [...prev, item], []),
      toPromise
    );

    expect(chunks.length).toEqual(3);

    expect(chunks[0].data).toEqual({
      author: {
        id: '1',
        name: 'Steve',
        __typename: 'Author',
        todos: [{ id: '1', text: 'stream', __typename: 'Todo' }],
      },
    });

    expect(chunks[1].data).toEqual({
      author: {
        id: '1',
        name: 'Steve',
        __typename: 'Author',
        todos: [
          { id: '1', text: 'stream', __typename: 'Todo' },
          { id: '2', text: 'defer', __typename: 'Todo' },
        ],
      },
    });

    expect(chunks[2].data).toEqual({
      author: {
        id: '1',
        name: 'Steve',
        __typename: 'Author',
        todos: [
          { id: '1', text: 'stream', __typename: 'Todo' },
          { id: '2', text: 'defer', __typename: 'Todo' },
        ],
      },
    });
  });

  it('listens for more responses (defer)', async () => {
    fetch.mockResolvedValue({
      status: 200,
      headers: {
        get() {
          return 'multipart/mixed';
        },
      },
      body: {
        getReader: function () {
          let cancelled = false;
          const results = [
            {
              done: false,
              value: Buffer.from('\r\n---'),
            },
            {
              done: false,
              value: Buffer.from(
                wrap({
                  hasNext: true,
                  data: {
                    author: {
                      id: '1',
                      __typename: 'Author',
                    },
                  },
                })
              ),
            },
            {
              done: false,
              value: Buffer.from(
                wrap({
                  path: ['author'],
                  data: { name: 'Steve' },
                  hasNext: true,
                })
              ),
            },
            {
              done: false,
              value: Buffer.from(wrap({ hasNext: false }) + '--'),
            },
            { done: true },
          ];
          let count = 0;
          return {
            cancel: function () {
              cancelled = true;
            },
            read: function () {
              if (cancelled) throw new Error('No');

              return Promise.resolve(results[count++]);
            },
          };
        },
      },
    });

    const AuthorFragment = gql`
      fragment authorFields on Author {
        name
      }
    `;

    const streamedQueryOperation: Operation = makeOperation(
      'query',
      {
        query: gql`
          query {
            author {
              id
              ...authorFields @defer
            }
          }

          ${AuthorFragment}
        `,
        variables: {},
        key: 1,
      },
      context
    );

    const chunks: OperationResult[] = await pipe(
      makeFetchSource(streamedQueryOperation, 'https://test.com/graphql', {}),
      scan((prev: OperationResult[], item) => [...prev, item], []),
      toPromise
    );

    expect(chunks.length).toEqual(3);

    expect(chunks[0].data).toEqual({
      author: {
        id: '1',
        __typename: 'Author',
      },
    });

    expect(chunks[1].data).toEqual({
      author: {
        id: '1',
        name: 'Steve',
        __typename: 'Author',
      },
    });

    expect(chunks[2].data).toEqual({
      author: {
        id: '1',
        name: 'Steve',
        __typename: 'Author',
      },
    });
  });

  it('listens for more responses (defer-neted)', async () => {
    fetch.mockResolvedValue({
      status: 200,
      headers: {
        get() {
          return 'multipart/mixed';
        },
      },
      body: {
        getReader: function () {
          let cancelled = false;
          const results = [
            {
              done: false,
              value: Buffer.from('\r\n---'),
            },
            {
              done: false,
              value: Buffer.from(
                wrap({
                  hasNext: true,
                  data: {
                    author: {
                      id: '1',
                      name: 'Steve',
                      address: {
                        country: 'UK',
                        __typename: 'Address',
                      },
                      __typename: 'Author',
                    },
                  },
                })
              ),
            },
            {
              done: false,
              value: Buffer.from(
                wrap({
                  path: ['author', 'address'],
                  data: { street: 'home' },
                  hasNext: true,
                })
              ),
            },
            {
              done: false,
              value: Buffer.from(wrap({ hasNext: false }) + '--'),
            },
            { done: true },
          ];
          let count = 0;
          return {
            cancel: function () {
              cancelled = true;
            },
            read: function () {
              if (cancelled) throw new Error('No');

              return Promise.resolve(results[count++]);
            },
          };
        },
      },
    });

    const AddressFragment = gql`
      fragment addressFields on Address {
        street
      }
    `;

    const streamedQueryOperation: Operation = makeOperation(
      'query',
      {
        query: gql`
          query {
            author {
              id
              address {
                id
                country
                ...addressFields @defer
              }
            }
          }

          ${AddressFragment}
        `,
        variables: {},
        key: 1,
      },
      context
    );

    const chunks: OperationResult[] = await pipe(
      makeFetchSource(streamedQueryOperation, 'https://test.com/graphql', {}),
      scan((prev: OperationResult[], item) => [...prev, item], []),
      toPromise
    );

    expect(chunks.length).toEqual(3);

    expect(chunks[0].data).toEqual({
      author: {
        id: '1',
        name: 'Steve',
        address: {
          country: 'UK',
          __typename: 'Address',
        },
        __typename: 'Author',
      },
    });

    expect(chunks[1].data).toEqual({
      author: {
        id: '1',
        name: 'Steve',
        address: {
          country: 'UK',
          street: 'home',
          __typename: 'Address',
        },
        __typename: 'Author',
      },
    });
  });
});
