import {
  makeSubject,
  map,
  pipe,
  publish,
  Source,
  Subject,
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
import { Operation, OperationResult } from '../types';
import { afterMutation, cacheExchange } from './cache';

let response;
let exchangeArgs;
let forwardedOperations: Operation[];
let reexecuteOperation;
let input: Subject<Operation>;

beforeEach(() => {
  response = queryResponse;
  forwardedOperations = [];
  reexecuteOperation = jest.fn();
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

  exchangeArgs = { forward, client };
});

describe('on query', () => {
  it('forwards to next exchange when no cache hit', () => {
    const [ops$, next, complete] = input;
    const exchange = cacheExchange(exchangeArgs)(ops$);

    publish(exchange);
    next(queryOperation);
    complete();
    expect(forwardedOperations.length).toBe(1);
    expect(reexecuteOperation).not.toBeCalled();
  });

  it('caches results', () => {
    const [ops$, next, complete] = input;
    const exchange = cacheExchange(exchangeArgs)(ops$);

    publish(exchange);
    next(queryOperation);
    next(queryOperation);
    complete();
    expect(forwardedOperations.length).toBe(1);
    expect(reexecuteOperation).not.toBeCalled();
  });

  describe('cache hit', () => {
    it('is false when operation is forwarded', () => {
      const [ops$, next, complete] = input;
      const exchange = cacheExchange(exchangeArgs)(ops$);

      publish(exchange);
      next(queryOperation);
      complete();

      expect(forwardedOperations[0].context).toHaveProperty('cacheHit', false);
    });

    it('is true when cached response is returned', async () => {
      const [ops$, next, complete] = input;
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
      expect(results[1].operation.context).toHaveProperty('cacheHit', true);
    });
  });
});

describe('on mutation', () => {
  it('does not cache', () => {
    response = mutationResponse;
    const [ops$, next, complete] = input;
    const exchange = cacheExchange(exchangeArgs)(ops$);

    publish(exchange);
    next(mutationOperation);
    next(mutationOperation);
    complete();
    expect(forwardedOperations.length).toBe(2);
    expect(reexecuteOperation).not.toBeCalled();
  });

  it('retriggers query operation', () => {
    const typename = 'ExampleType';
    const resultCache = new Map([[123, queryResponse]]);
    const operationCache = { [typename]: new Set([123]) };

    afterMutation(resultCache, operationCache, exchangeArgs.client)({
      ...mutationResponse,
      data: {
        todos: [
          {
            id: 1,
            __typename: typename,
          },
        ],
      },
    });

    expect(reexecuteOperation).toBeCalledTimes(1);
  });
});

describe('on subscription', () => {
  it('forwards subscriptions', () => {
    response = subscriptionResult;
    const [ops$, next, complete] = input;
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
    reexecuteOperation = jest.fn();
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

    exchangeArgs = { forward, client };
  });

  it('does not cache response', () => {
    const [ops$, next, complete] = input;
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
