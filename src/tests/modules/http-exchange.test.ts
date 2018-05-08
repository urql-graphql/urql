import { httpExchange } from '../../modules/http-exchange';
import { CombinedError } from '../../modules/error';

describe('httpExchange', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
    jest.restoreAllMocks();
    (global as any).AbortController = (global as any)._AbortController;
  });

  afterEach(() => {
    (global as any).AbortController = undefined;
  });

  it('accepts an operation and sends a request', done => {
    (global as any).fetch.mockReturnValue(
      Promise.resolve({
        json: () => ({ data: [{ id: 5 }] }),
        status: 200,
      })
    );

    const exchange = httpExchange();
    const operation = {
      context: {
        fetchOptions: {
          test: 1,
        },
        url: 'http://localhost:3000/graphql',
      },
      key: 'test',
      operationName: 'query',
      query: `{ ping }`,
      variables: {},
    };

    exchange(operation).subscribe({
      error: err => {
        throw err;
      },
      next: x => {
        expect(x).toEqual({ data: [{ id: 5 }] });
        expect((global as any).fetch).toHaveBeenCalledWith(
          'http://localhost:3000/graphql',
          {
            body: JSON.stringify({
              query: `{ ping }`,
              variables: {},
            }),
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
            signal: expect.any(Object),
            test: 1,
          }
        );

        done();
      },
    });
  });

  it('errors with CombinedError', done => {
    (global as any).fetch.mockReturnValue(
      Promise.resolve({
        json: () => ({ errors: ['error message'] }),
        status: 200,
      })
    );

    const exchange = httpExchange();
    const operation = {
      context: {
        fetchOptions: {},
        url: 'http://localhost:3000/graphql',
      },
      key: 'test',
      operationName: 'query',
      query: `{ ping }`,
    };

    exchange(operation).subscribe({
      error: err => {
        expect(err).toBeInstanceOf(CombinedError);
        done();
      },
      next: () => {
        throw new Error('Should not be called');
      },
    });
  });

  it('is cancellable using an unsubscription', () => {
    const abort = jest.fn();
    const signal = { signal: 1 };

    (global as any).AbortController = jest.fn().mockImplementation(() => ({
      abort,
      signal,
    }));

    (global as any).fetch.mockReturnValue(
      new Promise(resolve => {
        setTimeout(
          () =>
            resolve({
              json: () => ({ errors: ['should not be called'] }),
              status: 200,
            }),
          50
        );
      })
    );

    const exchange = httpExchange();
    const operation = {
      context: {
        fetchOptions: {},
        url: 'http://localhost:3000/graphql',
      },
      key: 'test',
      operationName: 'query',
      query: `{ ping }`,
    };

    const subscription = exchange(operation).subscribe({
      error: () => {
        throw new Error('Should not be called');
      },
      next: () => {
        throw new Error('Should not be called');
      },
    });

    subscription.unsubscribe();

    expect((global as any).fetch).toHaveBeenCalledWith(
      'http://localhost:3000/graphql',
      {
        body: JSON.stringify({ query: `{ ping }` }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        signal,
      }
    );

    expect(abort).toHaveBeenCalled();
  });

  it('throws when no data or errors have been returned', done => {
    (global as any).fetch.mockReturnValue(
      Promise.resolve({
        json: () => ({}),
        status: 200,
      })
    );

    const exchange = httpExchange();
    const operation = {
      context: {
        fetchOptions: {},
        url: 'http://localhost:3000/graphql',
      },
      key: 'test',
      operationName: 'query',
      query: `{ ping }`,
    };

    exchange(operation).subscribe({
      error: err => {
        expect(err.message).toBe('no data or error');
        done();
      },
      next: () => {
        throw new Error('Should not be called');
      },
    });
  });
});
