import { parse, print } from 'graphql';

/** NOTE: Testing in this file is designed to test both the client and it's interaction with default Exchanges */

jest.mock('./utils/keyForQuery', () => ({
  getKeyForQuery: () => 123,
  getKeyForRequest: () => 123,
}));

import { map, pipe, subscribe, tap } from 'wonka';
import { createClient } from './client';

const url = 'https://hostname.com';

describe('createClient', () => {
  it('passes snapshot', () => {
    const c = createClient({
      url,
    });

    expect(c).toMatchSnapshot();
  });

  describe('args', () => {
    describe('fetchOptions', () => {
      const fetchOptions = jest.fn(() => ({}));

      it('function is executed', () => {
        createClient({
          url,
          fetchOptions: fetchOptions as any,
        });

        expect(fetchOptions).toBeCalled();
      });
    });
  });
});

const query = {
  key: 1,
  query: `{ todos { id } }`,
  variables: { example: 1234 },
};

let receivedOps: any[] = [];
let client = createClient({ url: '1234' });
const receiveMock = jest.fn(s =>
  pipe(
    s,
    tap(op => (receivedOps = [...receivedOps, op])),
    map(op => ({ operation: op }))
  )
);
const exchangeMock = jest.fn(() => receiveMock);

beforeEach(() => {
  receivedOps = [];
  exchangeMock.mockClear();
  receiveMock.mockClear();
  client = createClient({ url, exchanges: [exchangeMock] as any[] });
});

describe('exchange args', () => {
  it('receives forward function', () => {
    // @ts-ignore
    expect(typeof exchangeMock.mock.calls[0][0].forward).toBe('function');
  });

  it('recieves client', () => {
    // @ts-ignore
    expect(exchangeMock.mock.calls[0][0]).toHaveProperty('client', client);
  });
});

describe('executeQuery', () => {
  it('passes query string exchange', () => {
    pipe(
      client.executeQuery(query),
      subscribe(x => x)
    );

    const receivedQuery = receivedOps[0].query;
    expect(print(receivedQuery)).toBe(print(parse(query.query)));
  });

  it('passes variables type to exchange', () => {
    pipe(
      client.executeQuery(query),
      subscribe(x => x)
    );

    expect(receivedOps[0]).toHaveProperty('variables', query.variables);
  });

  it('passes operationName type to exchange', () => {
    pipe(
      client.executeQuery(query),
      subscribe(x => x)
    );

    expect(receivedOps[0]).toHaveProperty('operationName', 'query');
  });

  it('passes url (from context) to exchange', () => {
    pipe(
      client.executeQuery(query),
      subscribe(x => x)
    );

    expect(receivedOps[0]).toHaveProperty('context.url', url);
  });
});

describe('executeMutation', () => {
  it('passes query string exchange', async () => {
    pipe(
      client.executeMutation(query),
      subscribe(x => x)
    );

    const receivedQuery = receivedOps[0].query;
    expect(print(receivedQuery)).toBe(print(parse(query.query)));
  });

  it('passes variables type to exchange', () => {
    pipe(
      client.executeMutation(query),
      subscribe(x => x)
    );

    expect(receivedOps[0]).toHaveProperty('variables', query.variables);
  });

  it('passes operationName type to exchange', () => {
    pipe(
      client.executeMutation(query),
      subscribe(x => x)
    );

    expect(receivedOps[0]).toHaveProperty('operationName', 'mutation');
  });

  it('passes url (from context) to exchange', () => {
    pipe(
      client.executeMutation(query),
      subscribe(x => x)
    );

    expect(receivedOps[0]).toHaveProperty('context.url', url);
  });
});

describe('executeSubscription', () => {
  it('passes query string exchange', async () => {
    pipe(
      client.executeSubscription(query),
      subscribe(x => x)
    );

    const receivedQuery = receivedOps[0].query;
    expect(print(receivedQuery)).toBe(print(parse(query.query)));
  });

  it('passes variables type to exchange', () => {
    pipe(
      client.executeSubscription(query),
      subscribe(x => x)
    );

    expect(receivedOps[0]).toHaveProperty('variables', query.variables);
  });

  it('passes operationName type to exchange', () => {
    pipe(
      client.executeSubscription(query),
      subscribe(x => x)
    );

    expect(receivedOps[0]).toHaveProperty('operationName', 'subscription');
  });
});
