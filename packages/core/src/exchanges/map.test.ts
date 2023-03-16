import { map, tap, pipe, fromValue, toArray, toPromise } from 'wonka';
import { vi, expect, describe, it } from 'vitest';

import { Client } from '../client';
import { queryResponse, queryOperation } from '../test-utils';
import { Operation } from '../types';
import { mapExchange } from './map';

import {
  makeOperation,
  makeErrorResult,
  makeResult,
  CombinedError,
} from '../utils';

describe('onOperation', () => {
  it('triggers and maps on operations', () => {
    const mockOperation = makeOperation('query', queryOperation, {
      ...queryOperation.context,
      mock: true,
    });

    const onOperation = vi.fn().mockReturnValue(mockOperation);
    const onExchangeResult = vi.fn();

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

    pipe(
      fromValue(queryOperation),
      mapExchange({ onOperation })(exchangeArgs),
      toArray
    );

    expect(onOperation).toBeCalledTimes(1);
    expect(onOperation).toBeCalledWith(queryOperation);
    expect(onExchangeResult).toBeCalledTimes(1);
    expect(onExchangeResult).toBeCalledWith(mockOperation);
  });

  it('triggers and forwards identity when returning undefined', () => {
    const onOperation = vi.fn().mockReturnValue(undefined);
    const onExchangeResult = vi.fn();

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

    pipe(
      fromValue(queryOperation),
      mapExchange({ onOperation })(exchangeArgs),
      toArray
    );

    expect(onOperation).toBeCalledTimes(1);
    expect(onOperation).toBeCalledWith(queryOperation);
    expect(onExchangeResult).toBeCalledTimes(1);
    expect(onExchangeResult).toBeCalledWith(queryOperation);
  });

  it('awaits returned promises as needed', async () => {
    const mockOperation = makeOperation('query', queryOperation, {
      ...queryOperation.context,
      mock: true,
    });

    const onOperation = vi.fn().mockResolvedValue(mockOperation);
    const onExchangeResult = vi.fn();

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

    await pipe(
      fromValue(queryOperation),
      mapExchange({ onOperation })(exchangeArgs),
      toPromise
    );

    expect(onOperation).toBeCalledTimes(1);
    expect(onOperation).toBeCalledWith(queryOperation);
    expect(onExchangeResult).toBeCalledTimes(1);
    expect(onExchangeResult).toBeCalledWith(mockOperation);
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

    const exchangeArgs = {
      forward: op$ =>
        pipe(
          op$,
          map((operation: Operation) => makeResult(operation, { data: null }))
        ),
      client: {} as Client,
      dispatchDebug: () => null,
    };

    pipe(
      fromValue(queryOperation),
      mapExchange({ onResult })(exchangeArgs),
      tap(onExchangeResult),
      toArray
    );

    expect(onResult).toBeCalledTimes(1);
    expect(onResult).toBeCalledWith(makeResult(queryOperation, { data: null }));
    expect(onExchangeResult).toBeCalledTimes(1);
    expect(onExchangeResult).toBeCalledWith(mockResult);
  });

  it('triggers and forwards identity when returning undefined', async () => {
    const onResult = vi.fn().mockReturnValue(undefined);
    const onExchangeResult = vi.fn();

    const exchangeArgs = {
      forward: op$ =>
        pipe(
          op$,
          map((operation: Operation) => makeResult(operation, { data: null }))
        ),
      client: {} as Client,
      dispatchDebug: () => null,
    };

    pipe(
      fromValue(queryOperation),
      mapExchange({ onResult })(exchangeArgs),
      tap(onExchangeResult),
      toArray
    );

    const result = makeResult(queryOperation, { data: null });
    expect(onResult).toBeCalledTimes(1);
    expect(onResult).toBeCalledWith(result);
    expect(onExchangeResult).toBeCalledTimes(1);
    expect(onExchangeResult).toBeCalledWith(result);
  });

  it('awaits returned promises as needed', async () => {
    const mockOperation = makeOperation('query', queryOperation, {
      ...queryOperation.context,
      mock: true,
    });

    const mockResult = makeErrorResult(mockOperation, new Error('Mock'));
    const onResult = vi.fn().mockResolvedValue(mockResult);
    const onExchangeResult = vi.fn();

    const exchangeArgs = {
      forward: op$ =>
        pipe(
          op$,
          map((operation: Operation) => makeResult(operation, { data: null }))
        ),
      client: {} as Client,
      dispatchDebug: () => null,
    };

    await pipe(
      fromValue(queryOperation),
      mapExchange({ onResult })(exchangeArgs),
      tap(onExchangeResult),
      toPromise
    );

    expect(onResult).toBeCalledTimes(1);
    expect(onResult).toBeCalledWith(makeResult(queryOperation, { data: null }));
    expect(onExchangeResult).toBeCalledTimes(1);
    expect(onExchangeResult).toBeCalledWith(mockResult);
  });
});

describe('onError', () => {
  it('does not trigger when there are no errors', async () => {
    const onError = vi.fn();

    const exchangeArgs = {
      forward: op$ =>
        pipe(
          op$,
          map((operation: Operation) => ({ ...queryResponse, operation }))
        ),
      client: {} as Client,
      dispatchDebug: () => null,
    };

    pipe(
      fromValue(queryOperation),
      mapExchange({ onError })(exchangeArgs),
      toArray
    );

    expect(onError).toBeCalledTimes(0);
  });

  it('triggers correctly when the operations has an error', async () => {
    const onError = vi.fn();
    const error = new Error('Sad times');

    const exchangeArgs = {
      forward: op$ =>
        pipe(
          op$,
          map((operation: Operation) => makeErrorResult(operation, error))
        ),
      client: {} as Client,
      dispatchDebug: () => null,
    };

    pipe(
      fromValue(queryOperation),
      mapExchange({ onError })(exchangeArgs),
      toArray
    );

    expect(onError).toBeCalledTimes(1);
    expect(onError).toBeCalledWith(
      new CombinedError({ networkError: error }),
      queryOperation
    );
  });
});
