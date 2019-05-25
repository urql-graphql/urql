import { print } from 'graphql';
import gql from 'graphql-tag';

/** NOTE: Testing in this file is designed to test both the client and it's interaction with default Exchanges */

jest.mock('./utils/keyForQuery', () => ({
  getKeyForQuery: () => 123,
  getKeyForRequest: () => 123,
}));

import { map, pipe, subscribe, tap, interval } from 'wonka';
import { createClient } from './client';

const url = 'https://hostname.com';

describe('createClient', () => {
  it('passes snapshot', () => {
    const c = createClient({
      url,
    });

    expect(c).toMatchSnapshot();
  });
});

const query = {
  key: 1,
  query: gql`
    {
      todos {
        id
      }
    }
  `,
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
    expect(print(receivedQuery)).toBe(print(query.query));
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
    expect(print(receivedQuery)).toBe(print(query.query));
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
    expect(print(receivedQuery)).toBe(print(query.query));
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

describe('createQuery', () => {
  const queryString = query.query;

  beforeEach(() => {
    // @ts-ignore
    client.executeQuery = jest.fn(() =>
      pipe(
        interval(400),
        map((i: number) => ({ data: i, error: i + 1 }))
      )
    );
  });

  afterAll(() => {
    //@ts-ignore
    client.executeQuery.mockClear();
  });

  it('should return a query function', () => {
    const myQuery = client.createQuery({ query: queryString });
    expect(myQuery().then).toBeInstanceOf(Function);
  });

  it('should call executeQuery with the initial variables', async () => {
    const myQuery = client.createQuery({
      query: queryString,
      variables: { foo: 'bar' },
    });

    await myQuery();
    //@ts-ignore
    expect(client.executeQuery.mock.calls[0][0].variables.foo).toBe('bar');
  });

  it('should call executeQuery with the new variables', async () => {
    const myQuery = client.createQuery({
      query: queryString,
      variables: { foo: 'bar' },
    });

    await myQuery({ foo: 'baz' });
    // @ts-ignore
    expect(client.executeQuery.mock.calls[0][0].variables.foo).toBe('baz');
  });
});

describe('createMutation', () => {
  const queryString = query.query;

  beforeEach(() => {
    // @ts-ignore
    client.executeMutation = jest.fn(() =>
      pipe(
        interval(400),
        map((i: number) => ({ data: i, error: i + 1 }))
      )
    );
  });

  afterAll(() => {
    //@ts-ignore
    client.executeMutation.mockClear();
  });

  it('should return a query function', () => {
    const myMutation = client.createMutation(queryString);
    expect(myMutation().then).toBeInstanceOf(Function);
  });

  it('should call executeQuery with the supplied variables', async () => {
    const myMutation = client.createMutation(queryString);

    await myMutation({ foo: 'bar' });
    //@ts-ignore
    expect(client.executeMutation.mock.calls[0][0].variables.foo).toBe('bar');
  });
});
