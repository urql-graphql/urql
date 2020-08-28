import { makeSubject, map, pipe, publish, Subject } from 'wonka';
import { Client } from '../client';
import { queryOperation } from '../test-utils';
import { makeErrorResult, CombinedError } from '../utils';
import { Operation } from '../types';
import { errorExchange } from './error';

const error = new Error('Sad times');
let input: Subject<Operation>;

beforeEach(() => {
  input = makeSubject<Operation>();
});

it('does not trigger when there are no errors', async () => {
  const onError = jest.fn();
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
  const exchange = errorExchange({ onError })(exchangeArgs)(ops$);

  publish(exchange);
  next(queryOperation);
  complete();
  expect(onError).toBeCalledTimes(0);
});

it('triggers correctly when the operations has an error', async () => {
  const onError = jest.fn();
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
  const exchange = errorExchange({ onError })(exchangeArgs)(ops$);

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
  const onError = jest.fn();
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
  const exchange = errorExchange({ onError })(exchangeArgs)(ops$);

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
