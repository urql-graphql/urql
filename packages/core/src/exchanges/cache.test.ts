import {
  makeSubject,
  map,
  pipe,
  publish,
  Source,
  Subject,
  forEach,
  scan,
  toPromise,
} from 'wonka';
import { Client } from '../client';
import {
  mutationOperation,
  mutationResponse,
  queryOperation,
  queryResponse,
  subscriptionOperation,
  subscriptionResult,
  undefinedQueryResponse,
} from '../test-utils';
import { Operation, OperationResult, ExchangeInput } from '../types';
import { cacheExchange } from './cache';

const reexecuteOperation = jest.fn();
const dispatchDebug = jest.fn();

let response;
let exchangeArgs: ExchangeInput;
let forwardedOperations: Operation[];
let input: Subject<Operation>;

beforeEach(jest.clearAllMocks);

beforeEach(() => {
  response = queryResponse;
  forwardedOperations = [];
  input = makeSubject<Operation>();

  // Collect all forwarded operations
  const forward = (s: Source<Operation>) => {
    return pipe(
      s,
      map(op => {
        forwardedOperations.push(op);
        return response;
      })
    );
  };

  const client = {
    reexecuteOperation: reexecuteOperation as any,
  } as Client;

  exchangeArgs = { forward, client, dispatchDebug };
});

describe('on query', () => {
  it('forwards to next exchange when no cache hit', () => {
    const { source: ops$, next, complete } = input;
    const exchange = cacheExchange(exchangeArgs)(ops$);

    publish(exchange);
    next(queryOperation);
    complete();
    expect(forwardedOperations.length).toBe(1);
    expect(reexecuteOperation).not.toBeCalled();
  });

  it('caches results', () => {
    const { source: ops$, next, complete } = input;
    const exchange = cacheExchange(exchangeArgs)(ops$);

    publish(exchange);
    next(queryOperation);
    next(queryOperation);
    complete();
    expect(forwardedOperations.length).toBe(1);
    expect(reexecuteOperation).not.toBeCalled();
  });

  it('respects cache-and-network', () => {
    const { source: ops$, next, complete } = input;
    const result = jest.fn();
    const exchange = cacheExchange(exchangeArgs)(ops$);

    pipe(exchange, forEach(result));
    next(queryOperation);

    next({
      ...queryOperation,
      context: {
        ...queryOperation.context,
        requestPolicy: 'cache-and-network',
      },
    });

    complete();
    expect(forwardedOperations.length).toBe(1);
    expect(reexecuteOperation).toHaveBeenCalledTimes(1);
    expect(result).toHaveBeenCalledTimes(2);
    expect(result.mock.calls[1][0].stale).toBe(true);

    expect(reexecuteOperation.mock.calls[0][0]).toEqual({
      ...queryOperation,
      context: { ...queryOperation.context, requestPolicy: 'network-only' },
    });
  });

  it('respects cache-only', () => {
    const { source: ops$, next, complete } = input;
    const exchange = cacheExchange(exchangeArgs)(ops$);

    publish(exchange);
    next({
      ...queryOperation,
      context: {
        ...queryOperation.context,
        requestPolicy: 'cache-only',
      },
    });
    complete();
    expect(forwardedOperations.length).toBe(0);
    expect(reexecuteOperation).not.toBeCalled();
  });

  describe('cache hit', () => {
    it('is miss when operation is forwarded', () => {
      const { source: ops$, next, complete } = input;
      const exchange = cacheExchange(exchangeArgs)(ops$);

      publish(exchange);
      next(queryOperation);
      complete();

      expect(forwardedOperations[0].context).toHaveProperty(
        'meta.cacheOutcome',
        'miss'
      );
    });

    it('is true when cached response is returned', async () => {
      const { source: ops$, next, complete } = input;
      const exchange = cacheExchange(exchangeArgs)(ops$);

      const results$ = pipe(
        exchange,
        scan((acc, x) => [...acc, x], [] as OperationResult[]),
        toPromise
      );

      publish(exchange);
      next(queryOperation);
      next(queryOperation);
      complete();

      const results = await results$;
      expect(results[1].operation.context).toHaveProperty(
        'meta.cacheOutcome',
        'hit'
      );
    });
  });
});

describe('on mutation', () => {
  it('does not cache', () => {
    response = mutationResponse;
    const { source: ops$, next, complete } = input;
    const exchange = cacheExchange(exchangeArgs)(ops$);

    publish(exchange);
    next(mutationOperation);
    next(mutationOperation);
    complete();
    expect(forwardedOperations.length).toBe(2);
    expect(reexecuteOperation).not.toBeCalled();
  });
});

describe('on subscription', () => {
  it('forwards subscriptions', () => {
    response = subscriptionResult;
    const { source: ops$, next, complete } = input;
    const exchange = cacheExchange(exchangeArgs)(ops$);

    publish(exchange);
    next(subscriptionOperation);
    next(subscriptionOperation);
    complete();
    expect(forwardedOperations.length).toBe(2);
    expect(reexecuteOperation).not.toBeCalled();
  });
});

// Empty query response implies the data propertys is undefined
describe('on empty query response', () => {
  beforeEach(() => {
    response = undefinedQueryResponse;
    forwardedOperations = [];
    input = makeSubject<Operation>();

    // Collect all forwarded operations
    const forward = (s: Source<Operation>) => {
      return pipe(
        s,
        map(op => {
          forwardedOperations.push(op);
          return response;
        })
      );
    };

    const client = {
      reexecuteOperation: reexecuteOperation as any,
    } as Client;

    exchangeArgs = { forward, client, dispatchDebug };
  });

  it('does not cache response', () => {
    const { source: ops$, next, complete } = input;
    const exchange = cacheExchange(exchangeArgs)(ops$);

    publish(exchange);
    next(queryOperation);
    next(queryOperation);
    complete();
    // 2 indicates it's not cached.
    expect(forwardedOperations.length).toBe(2);
    expect(reexecuteOperation).not.toBeCalled();
  });
});
