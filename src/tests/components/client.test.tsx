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
    component.update(
      <Client
        // @ts-ignore
        render={() => {
          return <div>hey</div>;
        }}
      />
    );
    tree = component.toJSON();
    expect(tree).toBeTruthy();
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

  it('should format new props', done => {
    fetchMock.mockResponse({ data: { todos: [{ id: 1 }] } });
    const clientModule = new ClientModule({ url: 'test' });
    // @ts-ignore
    let result;
    // @ts-ignore
    const client = renderer.create(
      <Client
        key="test"
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

    client.update(
      <Client
        key="test"
        client={clientModule}
        // @ts-ignore
        query={{ query: `{ posts { id } }` }}
        // @ts-ignore
        render={args => {
          result = args;
          return null;
        }}
      />
    );

    expect(client.getInstance().query).toMatchObject({
      query: `{
  posts {
    id
    __typename
  }
}
`,
      variables: undefined,
    });

    client.update(
      <Client
        key="test"
        client={clientModule}
        // @ts-ignore
        query={[{ query: `{ posts { id } }` }, { query: `{ posts { id } }` }]}
        // @ts-ignore
        render={args => {
          result = args;
          return null;
        }}
      />
    );

    expect(client.getInstance().query).toMatchObject([
      {
        query: `{
  posts {
    id
    __typename
  }
}
`,
        variables: undefined,
      },
      {
        query: `{
  posts {
    id
    __typename
  }
}
`,
        variables: undefined,
      },
    ]);

    done();
  });

  it('should format new mutations', () => {
    fetchMock.mockResponse({ data: { todos: [{ id: 1 }] } });
    const clientModule = new ClientModule({ url: 'test' });
    // @ts-ignore
    let result;
    // @ts-ignore
    const client = renderer.create(
      <Client
        // @ts-ignore
        key="test"
        client={clientModule}
        // @ts-ignore
        mutation={{
          addTodo: { query: `{ todos { id } }`, variables: undefined },
        }}
        // @ts-ignore
        render={args => {
          result = args;
          return null;
        }}
      />
    );

    expect(Object.keys(client.getInstance().mutations)).toMatchObject([
      'addTodo',
    ]);

    client.update(
      <Client
        // @ts-ignore
        key="test"
        client={clientModule}
        // @ts-ignore
        mutation={{
          removeTodo: { query: `{ todos { id } }`, variables: undefined },
        }}
        // @ts-ignore
        render={args => {
          result = args;
          return null;
        }}
      />
    );

    expect(Object.keys(client.getInstance().mutations)).toMatchObject([
      'removeTodo',
    ]);
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
    fetchMock.mockResponse({
      data: { todos: [{ id: 1, __typename: 'Todo' }] },
    });
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

  it('should return the proper render prop arguments with multiple queries supplied and an error', done => {
    fetchMock.mockError('lol');
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

    setTimeout(() => {
      let { data, error, fetching, loaded, refetch } = result;
      expect(data).toMatchObject([]);
      expect(error).toMatchObject(new Error('lol'));
      expect(fetching).toBe(false);
      expect(loaded).toBe(false);
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

  it('should update in response to mutations', done => {
    fetchMock.mockResponse({
      data: { todos: [{ id: 1, __typename: 'Todo' }] },
    });
    const clientModule = new ClientModule({ url: 'test' });
    let result;
    // @ts-ignore
    const spy = jest.spyOn(global, 'fetch');
    // @ts-ignore
    const client = renderer.create(
      <Client
        // @ts-ignore
        client={clientModule}
        // @ts-ignore
        query={{ query: `{ todos { id } }` }}
        // @ts-ignore
        mutation={{
          addTodo: {
            query: `mutation($id: id!) {
              addTodo(id: $id) {
                id
                text
              }
            }`,
            variables: { id: 1 },
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
      result.addTodo().then(() => {
        setTimeout(() => {
          let { data } = result;
          expect(spy).toHaveBeenCalledTimes(3);
          expect(data).toBeTruthy();
          spy.mockRestore();
          done();
        }, 200);
      });
    }, 0);
  });

  it('should respect the cache prop', done => {
    fetchMock.mockResponse({
      data: { todos: [{ id: 1, __typename: 'Todo' }] },
    });
    const clientModule = new ClientModule({ url: 'test' });
    let result;
    // @ts-ignore
    const spy = jest.spyOn(global, 'fetch');
    // @ts-ignore
    const client = renderer.create(
      <Client
        // @ts-ignore
        client={clientModule}
        // @ts-ignore
        cache={false}
        // @ts-ignore
        query={{ query: `{ todos { id } }` }}
        // @ts-ignore
        mutation={{
          addTodo: {
            query: `mutation($id: id!) {
              addTodo(id: $id) {
                id
                text
              }
            }`,
            variables: { id: 1 },
          },
        }}
        // @ts-ignore
        render={args => {
          result = args;
          return null;
        }}
      />
    );

    client.getInstance().fetch();

    setTimeout(() => {
      expect(spy).toHaveBeenCalledTimes(2);
      spy.mockRestore();
      done();
    }, 0);
  });

  it('should use shouldInvalidate if present', done => {
    fetchMock.mockResponse({
      data: { todos: [{ id: 1, __typename: 'Todo' }] },
    });
    const clientModule = new ClientModule({ url: 'test' });
    let result;
    // @ts-ignore
    const spy = jest.spyOn(global, 'fetch');
    // @ts-ignore
    const client = renderer.create(
      <Client
        // @ts-ignore
        client={clientModule}
        // @ts-ignore
        query={{ query: `{ todos { id } }` }}
        // @ts-ignore
        shouldInvalidate={() => false}
        // @ts-ignore
        mutation={{
          addTodo: {
            query: `mutation($id: id!) {
              addTodo(id: $id) {
                id
                text
              }
            }`,
            variables: { id: 1 },
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
      result.addTodo().then(() => {
        setTimeout(() => {
          let { data } = result;
          expect(spy).toHaveBeenCalledTimes(2);
          expect(data).toBeTruthy();
          spy.mockRestore();
          done();
        }, 200);
      });
    }, 0);
  });

  it('should not update in response to mutations that throw', done => {
    fetchMock.mockError('Yoinks');
    const clientModule = new ClientModule({ url: 'test' });
    let result;
    // @ts-ignore
    const spy = jest.spyOn(global, 'fetch');
    // @ts-ignore
    const client = renderer.create(
      <Client
        // @ts-ignore
        client={clientModule}
        // @ts-ignore
        query={{ query: `{ todos { id } }` }}
        // @ts-ignore
        mutation={{
          addTodo: {
            query: `mutation($id: id!) {
              addTodo(id: $id) {
                id
                text
              }
            }`,
            variables: { id: 1 },
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
      result.addTodo().catch(() => {
        expect(spy).toHaveBeenCalledTimes(2);
        spy.mockRestore();
        done();
      });
    }, 0);
  });

  it('shouldnt return data or mutations if neither is provided', () => {
    fetchMock.mockResponse({
      data: { todos: [{ id: 1, __typename: 'Todo' }] },
    });
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
