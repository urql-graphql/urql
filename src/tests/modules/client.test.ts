import Client, { defaultCache } from '../../modules/client';

describe('Client', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

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
      fetchOptions: {
        test: 5,
      },
      url: 'test',
    });
    expect(client.fetchOptions).toMatchObject({ test: 5 });
  });

  it('should set fetchOptions to an object if not provided', () => {
    const client = new Client({
      url: 'test',
    });
    expect(client.fetchOptions).toMatchObject({});
  });

  it('should set intialCache if provided', () => {
    const client = new Client({
      url: 'test',
      initialCache: {
        test: 5,
      },
    });
    expect(client.store).toMatchObject({ test: 5 });
  });

  it('should set cache if provided', () => {
    const myCache = defaultCache({});

    const client = new Client({
      cache: myCache,
      url: 'test',
    });

    expect(client.cache).toMatchObject(myCache);
  });

  describe('cache', () => {
    it('should provide a valid cache by default', done => {
      const store = {
        test: 5,
      };

      const myCache = defaultCache(store);

      const client = new Client({
        cache: myCache,
        url: 'test',
      });

      expect(client.cache.invalidate).toBeTruthy();
      expect(client.cache.invalidateAll).toBeTruthy();
      expect(client.cache.read).toBeTruthy();
      expect(client.cache.update).toBeTruthy();
      expect(client.cache.write).toBeTruthy();

      Promise.all([
        client.cache.invalidateAll(),
        client.cache.read('test'),
        client.cache.write('test', 5),
        client.cache.read('test'),
        client.cache.update((acc, key) => {
          if (key === 'test') {
            acc[key] = 6;
          }
        }),
        client.cache.read('test'),
        client.cache.invalidate('test'),
        client.cache.read('test'),
      ]).then(d => {
        expect(d).toMatchObject([
          undefined,
          null,
          'test',
          5,
          undefined,
          6,
          'test',
          null,
        ]);
        done();
      });
    });
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

  describe('refreshAllFromCache', () => {
    let client;

    beforeAll(() => {
      client = new Client({
        url: 'test',
      });
    });

    it('should call all registered subscribers with the last argument of true', () => {
      const spy = jest.fn();
      client.subscribe(spy);
      client.refreshAllFromCache();
      expect(spy).toBeCalledWith(null, null, true);
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
      (global as any).fetch.mockReturnValue(
        Promise.resolve({
          status: 200,
          json: () => ({ data: [{ id: 5 }] }),
        })
      );

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
          done();
        });
    });

    it('should return data from the cache if it is present', done => {
      (global as any).fetch.mockReturnValue(
        Promise.resolve({
          status: 200,
          json: () => ({ data: [{ id: 12345 }] }),
        })
      );

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

      (global as any).fetch.mockReturnValue(
        Promise.resolve({
          status: 200,
          json: () => ({ data: [{ id: 5 }] }),
        })
      );

      client
        .executeQuery({
          query: ``,
        })
        .then(() => {
          const body = JSON.stringify({
            query: ``,
          });
          expect((global as any).fetch).toHaveBeenCalledWith(
            'http://localhost:3000/graphql',
            {
              body: body,
              headers: { 'Content-Type': 'application/json' },
              method: 'POST',
              test: 5,
            }
          );

          done();
        });
    });

    it('should return "No Data" if data is not present', done => {
      client = new Client({
        url: 'http://localhost:3000/graphql',
      });

      (global as any).fetch.mockReturnValue(
        Promise.resolve({
          status: 200,
          json: () => ({ test: 5 }),
        })
      );

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
          done();
        });
    });

    it('should return an error if fetch throws', done => {
      client = new Client({
        url: 'http://localhost:3000/graphql',
      });

      (global as any).fetch.mockReturnValue(
        Promise.reject(new Error('Nooooo'))
      );

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

      (global as any).fetch.mockReturnValue(
        Promise.resolve({
          status: 200,
          json: () => ({ data: { test: 5 } }),
        })
      );

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
          done();
        });
    });

    it('should return "No Data" if data is not present', done => {
      client = new Client({
        url: 'http://localhost:3000/graphql',
      });

      (global as any).fetch.mockReturnValue(
        Promise.resolve({
          status: 200,
          json: () => ({ test: 5 }),
        })
      );

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
          expect(e).toMatchObject({ message: 'No data' });
          done();
        });
    });

    it('should return an error if fetch throws', done => {
      client = new Client({
        url: 'http://localhost:3000/graphql',
      });

      (global as any).fetch.mockReturnValue(Promise.reject(new Error('Noooo')));

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
          done();
        });
    });

    it('should return an error with attached response if fetch throws an HTTP error', () => {
      client = new Client({
        url: 'http://localhost:3000/graphql',
      });

      (global as any).fetch.mockReturnValue(
        Promise.resolve({
          status: 401,
          statusText: "I'm afraid I can't let you do that, Dave",
        })
      );

      return client
        .executeMutation({
          query: `{
          todos {
            id
            name
          }
        }`,
        })
        .catch(e => {
          expect(e).toBeInstanceOf(Error);
          expect(e).toHaveProperty(
            'response.statusText',
            "I'm afraid I can't let you do that, Dave"
          );
          expect(e).toHaveProperty('response.status', 401);
        });
    });

    it('should update subscribers', done => {
      client = new Client({
        url: 'http://localhost:3000/graphql',
      });

      (global as any).fetch.mockReturnValue(
        Promise.resolve({
          status: 200,
          json: () => ({ data: { test: 5 } }),
        })
      );

      const spy = jest.spyOn(client, 'updateSubscribers');

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
          done();
        });
    });
  });
});
