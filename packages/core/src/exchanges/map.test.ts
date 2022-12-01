import { makeSubject, map, tap, pipe, publish, Subject } from 'wonka';
import { vi, expect, describe, it, beforeEach } from 'vitest';

import { Client } from '../client';
import { queryOperation } from '../test-utils';
import {
  makeOperation,
  makeErrorResult,
  makeResult,
  CombinedError,
} from '../utils';
import { Operation } from '../types';
import { mapExchange } from './map';

const error = new Error('Sad times');
let input: Subject<Operation>;

beforeEach(() => {
  input = makeSubject<Operation>();
});

describe('onOperation', () => {
  it('triggers and maps on operations', async () => {
    const mockOperation = makeOperation('query', queryOperation, {
      ...queryOperation.context,
      mock: true,
    });

    const onOperation = vi.fn().mockReturnValue(mockOperation);
    const onExchangeResult = vi.fn();
    const { source: ops$, next, complete } = input;
    const exchangeArgs = {
      forward: op$ =>
        pipe(
          op$,
          tap(onExchangeResult),
          map((operation: Operation) => makeResult(operation, { data: null }))
        ),
      client: {} as Client,
      dispatchDebug: () => null,
    };
    const exchange = mapExchange({ onOperation })(exchangeArgs)(ops$);

    publish(exchange);
    next(queryOperation);
    complete();
    expect(onOperation).toBeCalledTimes(1);
    expect(onOperation).toBeCalledWith(queryOperation);
    expect(onExchangeResult).toBeCalledTimes(1);
    expect(onExchangeResult).toBeCalledWith(mockOperation);
  });

  it('triggers and forwards identity when returning undefined', async () => {
    const onOperation = vi.fn().mockReturnValue(undefined);
    const onExchangeResult = vi.fn();
    const { source: ops$, next, complete } = input;
    const exchangeArgs = {
      forward: op$ =>
        pipe(
          op$,
          tap(onExchangeResult),
          map((operation: Operation) => makeResult(operation, { data: null }))
        ),
      client: {} as Client,
      dispatchDebug: () => null,
    };
    const exchange = mapExchange({ onOperation })(exchangeArgs)(ops$);

    publish(exchange);
    next(queryOperation);
    complete();
    expect(onOperation).toBeCalledTimes(1);
    expect(onOperation).toBeCalledWith(queryOperation);
    expect(onExchangeResult).toBeCalledTimes(1);
    expect(onExchangeResult).toBeCalledWith(queryOperation);
  });
});

describe('onResult', () => {
  it('triggers and maps on results', async () => {
    const mockOperation = makeOperation('query', queryOperation, {
      ...queryOperation.context,
      mock: true,
    });

    const mockResult = makeErrorResult(mockOperation, new Error('Mock'));
    const onResult = vi.fn().mockReturnValue(mockResult);
    const onExchangeResult = vi.fn();

    const { source: ops$, next, complete } = input;
    const exchangeArgs = {
      forward: op$ =>
        pipe(
          op$,
          map((operation: Operation) => makeResult(operation, { data: null }))
        ),
      client: {} as Client,
      dispatchDebug: () => null,
    };

    const exchange = mapExchange({ onResult })(exchangeArgs)(ops$);
    pipe(exchange, tap(onExchangeResult), publish);

    next(queryOperation);
    complete();
    expect(onResult).toBeCalledTimes(1);
    expect(onResult).toBeCalledWith(makeResult(queryOperation, { data: null }));
    expect(onExchangeResult).toBeCalledTimes(1);
    expect(onExchangeResult).toBeCalledWith(mockResult);
  });

  it('triggers and forwards identity when returning undefined', async () => {
    const onOperation = vi.fn().mockReturnValue(undefined);
    const onExchangeResult = vi.fn();
    const { source: ops$, next, complete } = input;
    const exchangeArgs = {
      forward: op$ =>
        pipe(
          op$,
          tap(onExchangeResult),
          map((operation: Operation) => makeResult(operation, { data: null }))
        ),
      client: {} as Client,
      dispatchDebug: () => null,
    };
    const exchange = mapExchange({ onOperation })(exchangeArgs)(ops$);

    publish(exchange);
    next(queryOperation);
    complete();
    expect(onOperation).toBeCalledTimes(1);
    expect(onOperation).toBeCalledWith(queryOperation);
    expect(onExchangeResult).toBeCalledTimes(1);
    expect(onExchangeResult).toBeCalledWith(queryOperation);
  });
});

describe('onError', () => {
  it('does not trigger when there are no errors', async () => {
    const onError = vi.fn();
    const { source: ops$, next, complete } = input;
    const exchangeArgs = {
      forward: op$ =>
        pipe(
          op$,
          map((operation: Operation) => ({ operation }))
        ),
      client: {} as Client,
      dispatchDebug: () => null,
    };
    const exchange = mapExchange({ onError })(exchangeArgs)(ops$);

    publish(exchange);
    next(queryOperation);
    complete();
    expect(onError).toBeCalledTimes(0);
  });

  it('triggers correctly when the operations has an error', async () => {
    const onError = vi.fn();
    const { source: ops$, next, complete } = input;
    const exchangeArgs = {
      forward: op$ =>
        pipe(
          op$,
          map((operation: Operation) => makeErrorResult(operation, error))
        ),
      client: {} as Client,
      dispatchDebug: () => null,
    };
    const exchange = mapExchange({ onError })(exchangeArgs)(ops$);

    publish(exchange);
    next(queryOperation);
    complete();
    expect(onError).toBeCalledTimes(1);
    expect(onError).toBeCalledWith(
      new CombinedError({ networkError: error }),
      queryOperation
    );
  });

  it('triggers correctly multiple times the operations has an error', async () => {
    const onError = vi.fn();
    const { source: ops$, next, complete } = input;

    const firstQuery = {
      ...queryOperation,
      context: {
        ...queryOperation.context,
        item: 1,
      },
    };

    const secondQuery = {
      ...queryOperation,
      context: {
        ...queryOperation.context,
        item: 2,
      },
    };

    const thirdQuery = {
      ...queryOperation,
      context: {
        ...queryOperation.context,
        item: 3,
      },
    };

    const exchangeArgs = {
      forward: op$ =>
        pipe(
          op$,
          map((operation: Operation) => {
            if (operation.context.item === 2) {
              return { operation };
            }
            return makeErrorResult(operation, error);
          })
        ),
      client: {} as Client,
      dispatchDebug: () => null,
    };
    const exchange = mapExchange({ onError })(exchangeArgs)(ops$);

    publish(exchange);
    next(firstQuery);
    next(secondQuery);
    next(thirdQuery);
    complete();
    expect(onError).toBeCalledTimes(2);
    expect(onError).toBeCalledWith(
      new CombinedError({ networkError: error }),
      firstQuery
    );
    expect(onError).toBeCalledWith(
      new CombinedError({ networkError: error }),
      thirdQuery
    );
  });
});
