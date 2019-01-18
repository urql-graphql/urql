import { of } from 'rxjs';
import { take } from 'rxjs/operators';
import { queryOperation, subscriptionOperation } from '../test-utils';
import { Exchange } from '../types';
import { fetchExchange } from './fetch';

const fetch = (global as any).fetch as jest.Mock;
const abort = jest.fn();

const abortError = new Error();
abortError.name = 'AbortError';

beforeAll(() => {
  (global as any).AbortController = function AbortController() {
    this.signal = undefined;
    this.abort = abort;
  };
});

beforeEach(() => {
  fetch.mockClear();
  abort.mockClear();
});

afterAll(() => {
  (global as any).AbortController = undefined;
});

const repsonse = {
  status: 200,
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

it('should return response data from fetch', async () => {
  fetch.mockResolvedValue({
    status: 200,
    json: jest.fn().mockResolvedValue(repsonse),
  });

  const data = await fetchExchange(args)(of(queryOperation))
    .pipe(take(1))
    .toPromise();
  expect(data).toMatchSnapshot();
});

it('should return error data from fetch', async () => {
  fetch.mockResolvedValue({
    status: 400,
    json: jest.fn().mockResolvedValue(repsonse),
  });

  const data = await fetchExchange(args)(of(queryOperation))
    .pipe(take(1))
    .toPromise();
  expect(data).toMatchSnapshot();
});

it('should throw error when operationName is subscription', async () => {
  try {
    await fetchExchange(args)(of(subscriptionOperation)).toPromise();
    fail();
  } catch (err) {
    expect(err).toMatchSnapshot();
  }
});

it('should call cancel when the Observable is cancelled', () => {
  fetch.mockReturnValue(Promise.reject(abortError));

  const obs = fetchExchange(args)(of(queryOperation));
  const subscription = obs.subscribe(fail);

  subscription.unsubscribe();
  expect(abort).toHaveBeenCalledTimes(1);
  expect(fetch).toHaveBeenCalledTimes(1);
});
