import { vi, expect, it } from 'vitest';

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
import { subscriptionOperation, subscriptionResult } from '../test-utils';
import { stringifyDocument } from '../utils';
import { OperationResult } from '../types';
import { subscriptionExchange, SubscriptionForwarder } from './subscription';

it('should return response data from forwardSubscription observable', async () => {
  const exchangeArgs = {
    dispatchDebug: vi.fn(),
    forward: () => empty as Source<OperationResult>,
    client: {} as Client,
  };

  const unsubscribe = vi.fn();
  const forwardSubscription: SubscriptionForwarder = operation => {
    expect(operation.query).toBe(
      stringifyDocument(subscriptionOperation.query)
    );
    expect(operation.variables).toBe(subscriptionOperation.variables);

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
  const reexecuteOperation = vi.fn();
  const unsubscribe = vi.fn();

  const exchangeArgs = {
    dispatchDebug: vi.fn(),
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

it('should allow providing a custom isSubscriptionOperation implementation', async () => {
  const exchangeArgs = {
    dispatchDebug: vi.fn(),
    forward: () => empty as Source<OperationResult>,
    client: {} as Client,
  };

  const isSubscriptionOperation = vi.fn(() => true);

  const forwardSubscription: SubscriptionForwarder = () => ({
    subscribe(observer) {
      observer.next(subscriptionResult);
      return { unsubscribe: vi.fn() };
    },
  });

  await pipe(
    fromValue(subscriptionOperation),
    subscriptionExchange({ forwardSubscription, isSubscriptionOperation })(
      exchangeArgs
    ),
    take(1),
    toPromise
  );

  expect(isSubscriptionOperation).toHaveBeenCalled();
});
