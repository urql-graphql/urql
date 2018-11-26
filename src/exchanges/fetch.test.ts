import { of } from 'rxjs';
import { take } from 'rxjs/operators';
import { fetchExchange } from './fetch';
import { queryOperation, subscriptionOperation } from '../test-utils';

const fetch = (global as any).fetch as jest.Mock;

beforeEach(() => {
  fetch.mockClear();
});

const repsonse = {
  status: 200,
  data: {
    data: {
      user: 1200,
    },
  },
};

it('should return response data from fetch', async () => {
  fetch.mockResolvedValue({
    status: 200,
    json: jest.fn().mockResolvedValue(repsonse),
  });

  const data = await fetchExchange(jest.fn())(of(queryOperation))
    .pipe(take(1))
    .toPromise();
  expect(data).toMatchSnapshot();
});

it('should return error data from fetch', async () => {
  fetch.mockResolvedValue({
    status: 400,
    json: jest.fn().mockResolvedValue(repsonse),
  });

  const data = await fetchExchange(jest.fn())(of(queryOperation))
    .pipe(take(1))
    .toPromise();
  expect(data).toMatchSnapshot();
});

it('should throw error when operationName is subscription', async () => {
  try {
    await fetchExchange(jest.fn())(of(subscriptionOperation)).toPromise();
    fail();
  } catch (err) {
    expect(err).toMatchSnapshot();
  }
});
