import { empty, fromValue, pipe, Source, take, toPromise } from 'wonka';
import { Client } from '../lib/client';
import { subscriptionOperation, subscriptionResult } from '../test-utils';
import { OperationResult } from '../types';
import { subscriptionExchange, SubscriptionForwarder } from './subscription';

const exchangeArgs = {
  forward: () => empty as Source<OperationResult>,
  client: {} as Client,
};

it('should return response data from forwardSubscription observable', async () => {
  const unsubscribe = jest.fn();
  const forwardSubscription: SubscriptionForwarder = operation => {
    expect(operation.key).toBe(subscriptionOperation.key);
    expect(operation.query).toBe(subscriptionOperation.query);
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
