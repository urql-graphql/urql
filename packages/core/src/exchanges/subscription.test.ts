import { print } from 'graphql';
import {
  empty,
  publish,
  fromValue,
  pipe,
  Source,
  take,
  toPromise,
} from 'wonka';
import { Client } from '../client';
import {
  subscriptionOperation,
  subscriptionResult,
  queryOperation,
} from '../test-utils';
import { OperationResult } from '../types';
import { subscriptionExchange, SubscriptionForwarder } from './subscription';

it('should return response data from forwardSubscription observable', async () => {
  const exchangeArgs = {
    forward: () => empty as Source<OperationResult>,
    client: {} as Client,
  };

  const unsubscribe = jest.fn();
  const forwardSubscription: SubscriptionForwarder = operation => {
    expect(operation.query).toBe(print(subscriptionOperation.query));
    expect(operation.variables).toBe(subscriptionOperation.variables);
    expect(operation.context).toEqual(subscriptionOperation.context);

    return {
      subscribe(observer) {
        Promise.resolve().then(() => {
          observer.next(subscriptionResult);
        });

        return { unsubscribe };
      },
    };
  };

  const data = await pipe(
    fromValue(subscriptionOperation),
    subscriptionExchange({ forwardSubscription })(exchangeArgs),
    take(1),
    toPromise
  );

  expect(data).toMatchSnapshot();
  expect(unsubscribe).toHaveBeenCalled();
});

it('should tear down the operation if the source subscription ends', async () => {
  const reexecuteOperation = jest.fn();
  const unsubscribe = jest.fn();

  const exchangeArgs = {
    forward: () => empty as Source<OperationResult>,
    client: { reexecuteOperation: reexecuteOperation as any } as Client,
  };

  const forwardSubscription: SubscriptionForwarder = () => ({
    subscribe(observer) {
      observer.complete();
      return { unsubscribe };
    },
  });

  pipe(
    fromValue(subscriptionOperation),
    subscriptionExchange({ forwardSubscription })(exchangeArgs),
    publish
  );

  await Promise.resolve();

  expect(unsubscribe).not.toHaveBeenCalled();
  expect(reexecuteOperation).toHaveBeenCalled();
});

it('should allow for query operations with all operations enabled', async () => {
  const exchangeArgs = {
    forward: () => empty as Source<OperationResult>,
    client: {} as Client,
  };

  const unsubscribe = jest.fn();
  const forwardSubscription: SubscriptionForwarder = operation => {
    expect(operation.query).toBe(print(queryOperation.query));
    expect(operation.variables).toBe(queryOperation.variables);
    expect(operation.context).toEqual(queryOperation.context);

    return {
      subscribe(observer) {
        Promise.resolve().then(() => {
          observer.next(subscriptionResult);
        });

        return { unsubscribe };
      },
    };
  };

  const data = await pipe(
    fromValue(queryOperation),
    subscriptionExchange({
      enableAllOperations: true,
      forwardSubscription,
    })(exchangeArgs),
    take(1),
    toPromise
  );

  expect(data).toMatchSnapshot();
  expect(unsubscribe).toHaveBeenCalled();
});

it('should allow for selective operation skipping with all operations enabled', async () => {
  const exchangeArgs = {
    forward: () => empty as Source<OperationResult>,
    client: {} as Client,
  };

  const unsubscribe = jest.fn();
  const forwardSubscription: SubscriptionForwarder = operation => {
    expect(operation.query).toBe(print(queryOperation.query));
    expect(operation.variables).toBe(queryOperation.variables);
    expect(operation.context).toEqual(queryOperation.context);

    return {
      subscribe(observer) {
        Promise.resolve().then(() => {
          observer.next(subscriptionResult);
        });

        return { unsubscribe };
      },
    };
  };

  const data = await pipe(
    fromValue(queryOperation),
    subscriptionExchange({
      enableAllOperations: true,
      forwardSubscription,
    })(exchangeArgs),
    take(1),
    toPromise
  );

  expect(data).toMatchSnapshot();
  expect(unsubscribe).toHaveBeenCalled();
});

it('should allow for selective operation skipping with all operations enabled', async () => {
  const exchangeArgs = {
    forward: () => empty as Source<OperationResult>,
    client: {} as Client,
  };

  const unsubscribe = jest.fn();
  const forwardSubscription: SubscriptionForwarder = () => {
    expect(true).toBeFalsy();

    return {
      subscribe(observer) {
        Promise.resolve().then(() => {
          observer.next(subscriptionResult);
        });

        return { unsubscribe };
      },
    };
  };

  const data = pipe(
    fromValue(queryOperation),
    subscriptionExchange({
      enableAllOperations: true,
      forwardSubscription,
      skipOperation: op => op.key === queryOperation.key,
    })(exchangeArgs)
  );

  expect(data).toMatchSnapshot();
  expect(unsubscribe).toHaveBeenCalledTimes(0);
});
