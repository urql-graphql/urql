/* tslint:disable */

import React from 'react';
import Client from '../../components/client';
import { CombinedError } from '../../modules/error';
import { hashString } from '../../modules/hash';
import { formatTypeNames } from '../../modules/typenames';
import { default as ClientModule } from '../../modules/client';
import { subscriptionExchange } from '../../modules/subscription-exchange';
import { ClientEventType } from '../../interfaces/index';
import renderer from 'react-test-renderer';

describe('Client Component', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should return null with no render function', () => {
    // @ts-ignore
    const component = renderer.create(<Client />);
    let tree = component.toJSON();
    expect(tree).toBeNull();
    component.update(
      <Client
        // @ts-ignore
        children={() => {
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
        children={({ data, error, fetching, loaded, refetch }) => {
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
    (global as any).fetch.mockReturnValue(
      Promise.resolve({
        status: 200,
        json: () => ({ data: { todos: [{ id: 1 }] } }),
      })
    );
    const clientModule = new ClientModule({ url: 'test' });
    let result;
    // @ts-ignore
    const client = renderer.create(
      <Client
        client={clientModule}
        // @ts-ignore
        query={{ query: `{ todos { id } }` }}
        // @ts-ignore
        children={args => {
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
      expect(error).toBe(undefined);
      expect(fetching).toBe(false);
      expect(loaded).toBe(true);
      expect(refetch).toBeInstanceOf(Function);
      done();
    }, 200);
  });

  it('should format new props', done => {
    (global as any).fetch.mockReturnValue(
      Promise.resolve({
        status: 200,
        json: () => ({ data: { todos: [{ id: 1 }] } }),
      })
    );
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
        children={args => {
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
        children={args => {
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
        children={args => {
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
    (global as any).fetch.mockReturnValue(
      Promise.resolve({
        status: 200,
        json: () => ({ data: { todos: [{ id: 1 }] } }),
      })
    );
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
        children={args => {
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
        children={args => {
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
    (global as any).fetch.mockReturnValue(Promise.reject(new Error('oh no!')));
    const clientModule = new ClientModule({ url: 'test' });
    let result;
    // @ts-ignore
    const client = renderer.create(
      <Client
        client={clientModule}
        // @ts-ignore
        query={{ query: `{ todos { id } }` }}
        // @ts-ignore
        children={args => {
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
      expect(error.networkError).toMatchObject(new Error('oh no!'));
      expect(fetching).toBe(false);
      expect(loaded).toBe(false);
      expect(refetch).toBeInstanceOf(Function);
      done();
    }, 200);
  });

  it('should return the proper render prop arguments with multiple queries supplied', done => {
    (global as any).fetch.mockReturnValue(
      Promise.resolve({
        status: 200,
        json: () => ({ data: { todos: [{ id: 1, __typename: 'Todo' }] } }),
      })
    );
    const clientModule = new ClientModule({ url: 'test' });
    let result;
    // @ts-ignore
    const client = renderer.create(
      <Client
        client={clientModule}
        // @ts-ignore
        query={[{ query: `{ todos { id } }` }, { query: `{ todos { id } }` }]}
        // @ts-ignore
        children={args => {
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
      done();
    }, 200);
  });

  it('should return the proper render prop arguments with multiple queries supplied and an error', done => {
    (global as any).fetch.mockReturnValue(Promise.reject(new Error('lol')));
    const clientModule = new ClientModule({ url: 'test' });
    let result;
    // @ts-ignore
    const client = renderer.create(
      <Client
        client={clientModule}
        // @ts-ignore
        query={[{ query: `{ todos { id } }` }, { query: `{ todos { id } }` }]}
        // @ts-ignore
        children={args => {
          result = args;
          return null;
        }}
      />
    );

    setTimeout(() => {
      let { data, error, fetching, loaded, refetch } = result;
      expect(data).toEqual([]);
      expect(error.networkError.message).toBe('lol');
      expect(fetching).toBe(false);
      expect(loaded).toBe(false);
      expect(refetch).toBeInstanceOf(Function);
      done();
    }, 200);
  });

  it('should return mutations when mutations are provided', done => {
    (global as any).fetch.mockReturnValue(
      Promise.resolve({
        data: { todos: [{ id: 1 }] },
      })
    );
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
        children={args => {
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
    (global as any).fetch.mockReturnValue(
      Promise.resolve({
        status: 200,
        json: () => ({ data: { todos: [{ id: 1, __typename: 'Todo' }] } }),
      })
    );
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
        children={args => {
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
          done();
        }, 200);
      });
    }, 0);
  });

  it('should pass mutation result in Promise', done => {
    (global as any).fetch.mockReturnValue(
      Promise.resolve({
        status: 200,
        json: () => ({
          data: {
            addTodo: {
              id: '1',
              text: 'TestItem',
              __typename: 'Todo',
            },
          },
        }),
      })
    );
    const clientModule = new ClientModule({ url: 'test' });
    let result;
    // @ts-ignore
    const client = renderer.create(
      <Client
        // @ts-ignore
        client={clientModule}
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
        children={args => {
          result = args;
          return null;
        }}
      />
    );
    setTimeout(() => {
      result.addTodo().then(mutationResult => {
        expect(mutationResult).toEqual({
          addTodo: {
            id: '1',
            text: 'TestItem',
            __typename: 'Todo',
          },
        });
        done();
      });
    }, 0);
  });

  it('should update from cache when called with the refresh option', done => {
    (global as any).fetch.mockReturnValue(
      Promise.resolve({
        data: { todos: [{ id: 1, __typename: 'Todo' }] },
      })
    );
    const clientModule = new ClientModule({ url: 'test' });
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
        children={() => {
          return null;
        }}
      />
    );

    // NOTE: Delay here waits for the fetch to flush and complete, since
    // dedupExchange would deduplicate it otherwise
    setTimeout(() => {
      client.getInstance().update({
        type: ClientEventType.RefreshAll,
      });

      setTimeout(() => {
        expect(spy).toHaveBeenCalledTimes(2);
        spy.mockRestore();
        done();
      }, 100);
    }, 100);
  });

  it('should respect the cache prop', done => {
    (global as any).fetch.mockReturnValue(
      Promise.resolve({
        data: { todos: [{ id: 1, __typename: 'Todo' }] },
      })
    );
    const clientModule = new ClientModule({ url: 'test' });
    // @ts-ignore
    let result;
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
        children={args => {
          result = args;
          return null;
        }}
      />
    );

    // NOTE: Delay here waits for the fetch to flush and complete, since
    // dedupExchange would deduplicate it otherwise
    setTimeout(() => {
      client.getInstance().fetch();

      setTimeout(() => {
        expect((global as any).fetch).toHaveBeenCalledTimes(2);
        done();
      }, 0);
    }, 100);
  });

  it('should use shouldInvalidate if present', done => {
    (global as any).fetch.mockReturnValue(
      Promise.resolve({
        status: 200,
        json: () => ({ data: { todos: [{ id: 1, __typename: 'Todo' }] } }),
      })
    );
    const clientModule = new ClientModule({ url: 'test' });
    let result;
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
        children={args => {
          result = args;
          return null;
        }}
      />
    );
    setTimeout(() => {
      result.addTodo().then(() => {
        setTimeout(() => {
          let { data } = result;
          expect((global as any).fetch).toHaveBeenCalledTimes(2);
          expect(data).toBeTruthy();
          done();
        }, 200);
      });
    }, 0);
  });

  it('should not update in response to mutations that throw', done => {
    (global as any).fetch.mockReturnValue(Promise.reject(new Error('Yoinks!')));
    const clientModule = new ClientModule({ url: 'test' });
    let result;
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
        children={args => {
          result = args;
          return null;
        }}
      />
    );
    setTimeout(() => {
      result.addTodo().catch(() => {
        expect((global as any).fetch).toHaveBeenCalledTimes(2);
        done();
      });
    }, 0);
  });

  it('shouldnt return data or mutations if neither is provided', () => {
    const clientModule = new ClientModule({ url: 'test' });
    let result;
    // @ts-ignore
    const client = renderer.create(
      <Client
        // @ts-ignore
        client={clientModule}
        // @ts-ignore
        children={args => {
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

  it('should hash queries and read from the cache', () => {
    const query = `
      {
        todos {
          id
          __typename
        }
      }
    `;
    const formatted = formatTypeNames({ query, variables: {} });
    const hash = hashString(JSON.stringify(formatted));
    const clientModule = new ClientModule({ url: 'test' });
    clientModule.store[hash] = 5;

    // @ts-ignore
    const client = renderer.create(
      <Client
        // @ts-ignore
        client={clientModule}
        // @ts-ignore
        children={() => {
          return null;
        }}
      />
    );

    client
      .getInstance()
      .read({ query, variables: {} })
      .then(data => {
        expect(data).toBe(5);
      });
  });

  it('should invalidate the entire cache when invalidateAll is called', () => {
    const clientModule = new ClientModule({
      url: 'test',
      initialCache: { test: 5 },
    });

    // @ts-ignore
    const client = renderer.create(
      <Client
        // @ts-ignore
        client={clientModule}
        // @ts-ignore
        children={() => {
          return null;
        }}
      />
    );

    client
      .getInstance()
      .invalidateAll()
      .then(() => {
        expect(clientModule.store).toMatchObject({});
      });
  });

  it('should invalidate a query when invalidate is called with one', () => {
    const query = `
      {
        todos {
          id
          __typename
        }
      }
    `;
    const formatted = formatTypeNames({ query, variables: {} });
    const hash = hashString(JSON.stringify(formatted));
    const clientModule = new ClientModule({ url: 'test' });
    clientModule.store[hash] = 5;

    // @ts-ignore
    const client = renderer.create(
      <Client
        // @ts-ignore
        client={clientModule}
        // @ts-ignore
        children={() => {
          return null;
        }}
      />
    );

    client
      .getInstance()
      .invalidate({ query, variables: {} })
      .then(() => {
        expect(clientModule.store).toMatchObject({});
      });
  });

  it('should invalidate component query by default when invalidate is called', () => {
    const query = `
      {
        todos {
          id
          __typename
        }
      }
    `;

    (global as any).fetch.mockReturnValueOnce(
      Promise.resolve({
        data: { todos: [{ id: 1, __typename: 'Todo' }] },
      })
    );

    const clientModule = new ClientModule({ url: 'test' });

    // @ts-ignore
    const client = renderer.create(
      <Client
        // @ts-ignore
        query={{ query, variables: {} }}
        // @ts-ignore
        client={clientModule}
        // @ts-ignore
        children={() => {
          return null;
        }}
      />
    );

    client
      .getInstance()
      .invalidate()
      .then(() => {
        expect(clientModule.store).toMatchObject({});
      });
  });

  it('should invalidate component queries by default when invalidate is called', () => {
    const query = `
      {
        todos {
          id
          __typename
        }
      }
    `;

    (global as any).fetch.mockReturnValue(
      Promise.resolve({
        status: 200,
        data: { todos: [{ id: 1, __typename: 'Todo' }] },
      })
    );

    const clientModule = new ClientModule({ url: 'test' });

    // @ts-ignore
    const client = renderer.create(
      <Client
        // @ts-ignore
        query={[{ query, variables: {} }, { query, variables: {} }]}
        // @ts-ignore
        client={clientModule}
        // @ts-ignore
        children={() => {
          return null;
        }}
      />
    );

    return client
      .getInstance()
      .invalidate()
      .then(() => {
        expect(clientModule.store).toMatchObject({});
      });
  });

  it('should update cache when updateCache is called', () => {
    const clientModule = new ClientModule({
      url: 'test',
      initialCache: { test: 5 },
    });

    // @ts-ignore
    const client = renderer.create(
      <Client
        // @ts-ignore
        client={clientModule}
        // @ts-ignore
        children={() => {
          return null;
        }}
      />
    );

    return client
      .getInstance()
      .updateCache((store, key) => {
        if (key === 'test') {
          store[key] = 6;
        }
      })
      .then(() => {
        expect(clientModule.store).toMatchObject({ test: 6 });
      });
  });

  it('should trigger a refresh when refreshAllFromCache is called', () => {
    const clientModule = new ClientModule({
      url: 'test',
    });

    // @ts-ignore
    const client = renderer.create(
      <Client
        // @ts-ignore
        client={clientModule}
        // @ts-ignore
        children={() => {
          return null;
        }}
      />
    );

    const spy = jest.spyOn(clientModule, 'refreshAllFromCache');

    return client
      .getInstance()
      .refreshAllFromCache()
      .then(() => {
        expect(spy).toHaveBeenCalled();
      });
  });

  it('should handle subscriptions and return the proper render prop arguments', () => {
    const unsubscribe = jest.fn();

    let observer;
    const createSubscription = (_, _observer) => {
      observer = _observer;
      return { unsubscribe };
    };

    const clientModule = new ClientModule({
      url: 'test',
      transformExchange: x => subscriptionExchange(createSubscription, x),
    });

    let result;
    // @ts-ignore
    const client = renderer.create(
      <Client
        client={clientModule}
        subscription={{ query: `subscription { todos { id } }` }}
        children={args => {
          result = args;
          return null;
        }}
      />
    );

    expect(result.data).toBe(null);
    expect(result.error).toBe(null);
    expect(result.loaded).toBe(false);

    observer.next({ data: 'test1' });
    expect(result.data).toBe('test1');
    expect(result.loaded).toBe(true);

    observer.next({ data: 'test2' });
    expect(result.data).toBe('test2');

    observer.next({ errors: ['testerr'] });
    expect(result.data).toBe(null);
    expect(result.error).toEqual(
      new CombinedError({
        graphQLErrors: ['testerr'],
      })
    );

    observer.error(new Error('uhnuuuu'));

    expect(result.fetching).toBe(false);
    expect(result.error).toEqual(
      new CombinedError({
        networkError: new Error('uhnuuuu'),
      })
    );
  });

  it('should not accept query and subscription props at the same time', () => {
    expect(() => {
      const p = {
        query: { query: `{ todos { id } }` },
        subscription: { query: `subscription { todos { id } }` },
      };

      // @ts-ignore
      const c = new Client(p as any);

      c.formatProps(p);
    }).toThrowErrorMatchingSnapshot();
  });

  it('should handle subscription, query, and updateSubscription props', done => {
    const data = { todos: [{ id: 1, __typename: 'Todo' }] };

    (global as any).fetch.mockReturnValue(
      Promise.resolve({
        status: 200,
        json: () => ({ data }),
      })
    );

    const unsubscribe = jest.fn();

    let observer;
    const createSubscription = (_, _observer) => {
      observer = _observer;
      return { unsubscribe };
    };

    const clientModule = new ClientModule({
      url: 'test',
      transformExchange: x => subscriptionExchange(createSubscription, x),
    });

    const query = `{ todos { id } }`;
    const updateSubscription = (_, next) => next;

    let result;
    // @ts-ignore
    const client = renderer.create(
      <Client
        client={clientModule}
        query={{ query }}
        subscription={{ query: `subscription { todos { id } }` }}
        updateSubscription={updateSubscription}
        children={args => {
          result = args;
          return null;
        }}
      />
    );

    expect(result.data).toBe(null);
    expect(result.error).toBe(null);
    expect(result.loaded).toBe(false);
    expect(Object.keys(clientModule.store).length).toBe(0);

    setTimeout(() => {
      expect(result.data).toBe(data);
      expect(result.loaded).toBe(true);
      expect(Object.keys(clientModule.store).length).toBe(1);

      const newData = { test: 'test1' };
      observer.next({ data: newData });

      expect(result.data).toBe(newData);
      expect(Object.keys(clientModule.store).length).toBe(0);

      done();
    }, 100);
  });

  it('should handle subscription, query array, and updateSubscription props', done => {
    const data = { todos: [{ id: 1, __typename: 'Todo' }] };

    (global as any).fetch.mockReturnValue(
      Promise.resolve({
        status: 200,
        json: () => ({ data }),
      })
    );

    const unsubscribe = jest.fn();

    let observer;
    const createSubscription = (_, _observer) => {
      observer = _observer;
      return { unsubscribe };
    };

    const clientModule = new ClientModule({
      url: 'test',
      transformExchange: x => subscriptionExchange(createSubscription, x),
    });

    const query = `{ todos { id } }`;
    const updateSubscription = (_, next) => next;

    let result;
    // @ts-ignore
    const client = renderer.create(
      <Client
        client={clientModule}
        query={[{ query }, { query }]}
        subscription={{ query: `subscription { todos { id } }` }}
        updateSubscription={updateSubscription}
        children={args => {
          result = args;
          return null;
        }}
      />
    );

    expect(result.data).toBe(null);
    expect(result.error).toBe(null);
    expect(result.loaded).toBe(false);
    expect(Object.keys(clientModule.store).length).toBe(0);

    setTimeout(() => {
      expect(result.data).toEqual([data, data]);
      expect(result.loaded).toBe(true);
      expect(Object.keys(clientModule.store).length).toBe(1);

      const newData = { test: 'test1' };
      observer.next({ data: newData });

      expect(result.data).toBe(newData);
      expect(Object.keys(clientModule.store).length).toBe(0);

      done();
    }, 100);
  });

  it('should unsubscribe before starting a new query', () => {
    (global as any).fetch.mockReturnValue(new Promise(() => {}));
    const clientModule = new ClientModule({ url: 'test' });
    const query = `{ todos { id } }`;

    // @ts-ignore
    const client = renderer.create(
      <Client client={clientModule} query={{ query }} children={() => null} />
    );

    expect(client.getInstance().querySub).not.toBeNull();
    const spy = jest.spyOn(client.getInstance().querySub, 'unsubscribe');

    // Manually trigger fetch
    client.getInstance().fetch();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should unsubscribe before starting a new subscription', () => {
    const createSubscription = (_, _observer) => ({ unsubscribe: () => {} });
    const clientModule = new ClientModule({
      url: 'test',
      transformExchange: x => subscriptionExchange(createSubscription, x),
    });

    // @ts-ignore
    const client = renderer.create(
      <Client
        client={clientModule}
        subscription={{ query: `subscription { ideas { id } }` }}
        children={() => null}
      />
    );

    expect(client.getInstance().subscriptionSub).not.toBeNull();
    const spy = jest.spyOn(client.getInstance().subscriptionSub, 'unsubscribe');

    // Manually trigger fetch
    client.getInstance().subscribeToQuery();

    expect(spy).toHaveBeenCalledTimes(1);
  });
});
