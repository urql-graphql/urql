import Client from '../../modules/client';

import fetchMock from '../utils/fetch-mock';

describe('Client', () => {
  it('should throw without options provided', () => {
    expect(() => {
      new Client();
    }).toThrowError('Please provide configuration object');
  });

  it('should throw without a url provided', () => {
    expect(() => {
      // @ts-ignore
      new Client({});
    }).toThrowError('Please provide a URL for your GraphQL API');
  });

  it('should return a client instance', () => {
    const client = new Client({
      url: 'test',
    });
    expect(client.url).toMatch('test');
  });

  it('should set fetchOptions', () => {
    const client = new Client({
      url: 'test',
      fetchOptions: {
        test: 5,
      },
    });
    expect(client.fetchOptions).toMatchObject({ test: 5 });
  });

  it('should set fetchOptions to an object if not provided', () => {
    const client = new Client({
      url: 'test',
    });
    expect(client.fetchOptions).toMatchObject({});
  });

  describe('updateSubscribers', () => {
    let client;

    beforeAll(() => {
      client = new Client({
        url: 'test',
      });
    });

    it('should call all registered subscribers with typenames and changes', () => {
      const spy = jest.fn();
      client.subscribe(spy);
      const typenames = ['a', 'b'];
      const changes = { a: 5 };
      client.updateSubscribers(typenames, changes);
      expect(spy).toBeCalledWith(typenames, changes);
    });
  });

  describe('subscribe', () => {
    let client;

    beforeAll(() => {
      client = new Client({
        url: 'test',
      });
    });

    it('should return a unique id', () => {
      const callback = () => {};
      const id = client.subscribe(callback);
      expect(id).not.toBeNull();
    });

    it('should add function arguments to the internal subscriptions array', () => {
      const callback = () => {};
      const id = client.subscribe(callback);
      expect(client.subscriptions[id]).toBe(callback);
    });
  });

  describe('unsubscribe', () => {
    let client;

    beforeAll(() => {
      client = new Client({
        url: 'test',
      });
    });

    it('should remove from subscriptions by id', () => {
      const callback = () => {};
      const id = client.subscribe(callback);
      client.unsubscribe(id);
      expect(client.subscriptions[id]).toBeUndefined();
    });
  });

  describe('executeQuery', () => {
    let client;

    it('should return data if there is data', done => {
      client = new Client({
        url: 'http://localhost:3000/graphql',
      });
      fetchMock.mockResponse({ data: [{ id: 5 }] });

      client
        .executeQuery({
          query: `{
          todos {
            id
            name
          }
        }`,
        })
        .then(result => {
          expect(result).toMatchObject({ data: [{ id: 5 }], typeNames: [] });
          fetchMock.restore();
          done();
        });
    });

    it('should return data from the cache if it is present', done => {
      fetchMock.mockResponse({ data: [{ id: 12345 }] });

      client
        .executeQuery({
          query: `{
          todos {
            id
            name
          }
        }`,
        })
        .then(data => {
          expect(data).toMatchObject({
            data: [{ id: 5 }],
            typeNames: [],
          });
          fetchMock.restore();
          done();
        });
    });

    it('should include fetchOptions', done => {
      client = new Client({
        url: 'http://localhost:3000/graphql',
        fetchOptions: {
          test: 5,
        },
      });

      fetchMock.mockResponse({ data: [{ id: 5 }] });
      // @ts-ignore
      let spy = jest.spyOn(global, 'fetch');

      client
        .executeQuery({
          query: ``,
        })
        .then(() => {
          const body = JSON.stringify({
            query: ``,
          });
          expect(spy).toHaveBeenCalledWith('http://localhost:3000/graphql', {
            body: body,
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
            test: 5,
          });
          fetchMock.restore();
          spy.mockRestore();
          done();
        });
    });

    it('should return "No Data" if data is not present', done => {
      client = new Client({
        url: 'http://localhost:3000/graphql',
      });

      fetchMock.mockResponse({ test: 5 });

      client
        .executeQuery({
          query: `{
          todos {
            id
            name
          }
        }`,
        })
        .catch(e => {
          expect(e).toMatchObject({ message: 'No data' });
          fetchMock.restore();
          done();
        });
    });

    it('should return an error if fetch throws', done => {
      client = new Client({
        url: 'http://localhost:3000/graphql',
      });

      fetchMock.mockError('Nooooo');

      client
        .executeQuery({
          query: `{
          todos {
            id
            name
          }
        }`,
        })
        .catch(e => {
          expect(e).toMatchObject(new Error('Nooooo'));
          fetchMock.restore();
          done();
        });
    });
  });

  describe('executeMutation', () => {
    let client;
    it('should return specified data if present', done => {
      client = new Client({
        url: 'http://localhost:3000/graphql',
      });

      fetchMock.mockResponse({ data: { test: 5 } });

      client
        .executeMutation({
          query: `{
          todos {
            id
            name
          }
        }`,
        })
        .then(data => {
          expect(data).toMatchObject({ test: 5 });
          fetchMock.restore();
          done();
        });
    });

    it('should return an error if fetch throws', done => {
      client = new Client({
        url: 'http://localhost:3000/graphql',
      });

      fetchMock.mockError('Noooo');

      client
        .executeMutation({
          query: `{
          todos {
            id
            name
          }
        }`,
        })
        .catch(e => {
          expect(e).toMatchObject(new Error('Noooo'));
          fetchMock.restore();
          done();
        });
    });

    it('should update subscribers', done => {
      client = new Client({
        url: 'http://localhost:3000/graphql',
      });

      fetchMock.mockResponse({ data: { test: 5 } });
      let spy = jest.spyOn(client, 'updateSubscribers');

      client
        .executeMutation({
          query: `{
          todos {
            id
            name
          }
        }`,
        })
        .then(() => {
          expect(spy).toHaveBeenCalledWith([], { data: { test: 5 } });
          fetchMock.restore();
          spy.mockRestore();
          done();
        });
    });
  });
});
