import { of } from 'rxjs';
import { fetchExchange } from './fetch';
import { queryOperation, queryResponse } from '../samples';

let exchange = fetchExchange();
const fetch = (global as any).fetch as jest.Mock;

beforeEach(() => {
  exchange = fetchExchange();
  fetch.mockClear();
});

it('should not call forward', async () => {
  const forwardMock = jest.fn();
  fetch.mockResolvedValue({ json: jest.fn().mockResolvedValue(true) });

  await exchange(forwardMock)(of(queryOperation)).toPromise();
  expect(forwardMock).toBeCalledTimes(0);
});

it('should return response data from fetch', async () => {
  fetch.mockResolvedValue({ json: jest.fn().mockResolvedValue(queryResponse) });

  const data = await exchange(jest.fn())(of(queryOperation)).toPromise();
  expect(data).toEqual(queryResponse);
});
