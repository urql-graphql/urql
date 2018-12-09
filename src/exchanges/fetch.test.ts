import { of } from 'rxjs';
import { take } from 'rxjs/operators';
import { queryOperation, subscriptionOperation } from '../test-utils';
import { fetchExchange } from './fetch';

const fetch = (global as any).fetch as jest.Mock;

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

beforeEach(() => {
  fetch.mockClear();
  args.forward.mockClear();
});

it('should return response data from fetch', async () => {
  fetch.mockResolvedValue({
    status: 200,
    json: jest.fn().mockResolvedValue(repsonse),
  });

  fetchExchange(args)(of(queryOperation));
  const data = await args.forward.mock.calls[0][0].pipe(take(1)).toPromise();
  expect(data).toMatchSnapshot();
});

it('should return error data from fetch', async () => {
  fetch.mockResolvedValue({
    status: 400,
    json: jest.fn().mockResolvedValue(repsonse),
  });

  fetchExchange(args)(of(queryOperation));
  const data = await args.forward.mock.calls[0][0].pipe(take(1)).toPromise();
  expect(data).toMatchSnapshot();
});

it('should throw error when operationName is subscription', async () => {
  try {
    fetchExchange(args)(of(subscriptionOperation));
    await args.forward.mock.calls[0][0].pipe(take(1)).toPromise();
    fail();
  } catch (err) {
    expect(err).toMatchSnapshot();
  }
});
