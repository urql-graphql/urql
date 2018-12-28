import { of } from 'rxjs';
import { take } from 'rxjs/operators';
import { subscriptionExchange } from './subscription';
import { subscriptionOperation } from '../test-utils';

const response = {
  data: {
    data: {
      user: 1200,
    },
  },
};

const args = {
  forward: jest.fn(),
  subject: {},
} as any;

const createOperation = res => {
  const unsubscribe = jest.fn();

  const operation = { ...subscriptionOperation };
  operation.query.replace('subscribeToUser', `${Math.random() * Date.now()}`);
  operation.context.forwardSubscription = jest.fn();

  if (res) {
    operation.context.forwardSubscription.mockImplementation((_, observer) => {
      observer.next(res);
      return { unsubscribe };
    });
  }

  return { operation, unsubscribe };
};

it('should return response data from fetch', async () => {
  const { operation } = createOperation(response);

  const data = await subscriptionExchange(args)(of(operation))
    .pipe(take(1))
    .toPromise();

  expect(data).toMatchSnapshot();
});

it('should unsubscribe from future data', async () => {
  const { operation, unsubscribe } = createOperation(response);

  // Subscribe
  await subscriptionExchange(args)(of(operation))
    .pipe(take(1))
    .toPromise();

  // Unsubscribe
  operation.context.unsubscribe = true;
  subscriptionExchange(args)(of(operation)).subscribe(() => void 0);

  expect(unsubscribe).toBeCalled();
});
