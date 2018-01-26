import React from 'react';
import Client from '../../components/client';
import { default as ClientModule } from '../../modules/client';
import renderer from 'react-test-renderer';
import fetchMock from '../utils/fetch-mock';

describe('Client Component', () => {
  it('should return null with no render function', () => {
    // @ts-ignore
    const component = renderer.create(<Client />);
    let tree = component.toJSON();
    expect(tree).toBeNull();
  });

  it('should use the render prop when supplied and render the defaults', done => {
    // @ts-ignore
    const client = renderer.create(
      <Client
        // @ts-ignore
        render={({ data, error, fetching, loaded, refetch }) => {
          expect(data).toBeNull();
          expect(error).toBeNull();
          expect(fetching).toBe(false);
          expect(loaded).toBe(false);
          expect(refetch).toBeInstanceOf(Function);
          done();
          return null;
        }}
      />
    );
  });

  it('should return the proper render prop arguments with a query supplied', done => {
    fetchMock.mockResponse({ data: { todos: [{ id: 1 }] } });
    const clientModule = new ClientModule({ url: 'test' });
    let result;
    // @ts-ignore
    const client = renderer.create(
      <Client
        client={clientModule}
        // @ts-ignore
        query={{ query: `{ todos { id } }` }}
        // @ts-ignore
        render={args => {
          result = args;
          return null;
        }}
      />
    );

    let { data, error, fetching, loaded, refetch } = result;
    expect(data).toBeNull();
    expect(error).toBeNull();
    expect(fetching).toBe(true);
    expect(loaded).toBe(false);
    expect(refetch).toBeInstanceOf(Function);

    setTimeout(() => {
      let { data, error, fetching, loaded, refetch } = result;
      expect(data).toMatchObject({ todos: [{ id: 1 }] });
      expect(error).toBeNull();
      expect(fetching).toBe(false);
      expect(loaded).toBe(true);
      expect(refetch).toBeInstanceOf(Function);
      fetchMock.restore();
      done();
    }, 200);
  });

  it('should return an error thrown by fetch', done => {
    fetchMock.mockError('oh no!');
    const clientModule = new ClientModule({ url: 'test' });
    let result;
    // @ts-ignore
    const client = renderer.create(
      <Client
        client={clientModule}
        // @ts-ignore
        query={{ query: `{ todos { id } }` }}
        // @ts-ignore
        render={args => {
          result = args;
          return null;
        }}
      />
    );

    let { data, error, fetching, loaded, refetch } = result;
    expect(data).toBeNull();
    expect(error).toBeNull();
    expect(fetching).toBe(true);
    expect(loaded).toBe(false);
    expect(refetch).toBeInstanceOf(Function);

    setTimeout(() => {
      let { data, error, fetching, loaded, refetch } = result;
      expect(data).toBeNull();
      expect(error).toMatchObject(new Error('oh no!'));
      expect(fetching).toBe(false);
      expect(loaded).toBe(false);
      expect(refetch).toBeInstanceOf(Function);
      fetchMock.restore();
      done();
    }, 200);
  });

  it('should return the proper render prop arguments with multiple queries supplied', done => {
    fetchMock.mockResponse({ data: { todos: [{ id: 1 }] } });
    const clientModule = new ClientModule({ url: 'test' });
    let result;
    // @ts-ignore
    const client = renderer.create(
      <Client
        client={clientModule}
        // @ts-ignore
        query={[{ query: `{ todos { id } }` }, { query: `{ todos { id } }` }]}
        // @ts-ignore
        render={args => {
          result = args;
          return null;
        }}
      />
    );

    let { data, error, fetching, loaded, refetch } = result;
    expect(data).toBeNull();
    expect(error).toBeNull();
    expect(fetching).toBe(true);
    expect(loaded).toBe(false);
    expect(refetch).toBeInstanceOf(Function);

    setTimeout(() => {
      let { data, error, fetching, loaded, refetch } = result;
      expect(data).toMatchObject([
        { todos: [{ id: 1 }] },
        { todos: [{ id: 1 }] },
      ]);
      expect(error).toBeNull();
      expect(fetching).toBe(false);
      expect(loaded).toBe(true);
      expect(refetch).toBeInstanceOf(Function);
      fetchMock.restore();
      done();
    }, 200);
  });

  it('should return mutations when mutations are provided', done => {
    fetchMock.mockResponse({ data: { todos: [{ id: 1 }] } });
    const clientModule = new ClientModule({ url: 'test' });
    let result;
    // @ts-ignore
    const client = renderer.create(
      <Client
        // @ts-ignore
        client={clientModule}
        // @ts-ignore
        mutation={{
          test: {
            query: `mutation($text: String!) {
              addTodo(text: $text) {
                id
                text
              }
            }`,
            variables: {},
          },
          test2: {
            query: `mutation($text: String!) {
              addTodo2(text: $text) {
                id
                text
              }
            }`,
            variables: {},
          },
        }}
        // @ts-ignore
        render={args => {
          result = args;
          return null;
        }}
      />
    );
    setTimeout(() => {
      let { test, test2 } = result;
      expect(test).toBeTruthy();
      expect(test2).toBeTruthy();
      done();
    }, 200);
  });

  it('shouldnt return data or mutations if neither is provided', () => {
    fetchMock.mockResponse({ data: { todos: [{ id: 1 }] } });
    const clientModule = new ClientModule({ url: 'test' });
    let result;
    // @ts-ignore
    const client = renderer.create(
      <Client
        // @ts-ignore
        client={clientModule}
        // @ts-ignore
        render={args => {
          result = args;
          return null;
        }}
      />
    );

    expect(result).toMatchObject({
      loaded: false,
      fetching: false,
      error: null,
      data: null,
      refetch: result.refetch,
    });
  });
});
