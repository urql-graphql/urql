import { of } from 'rxjs';
import { cacheExchange } from './cache';
import {
  queryResponse,
  queryOperation,
  mutationResponse,
  mutationOperation,
} from '../util/samples';

let exchange = cacheExchange();
const forwardMock = jest.fn();

beforeEach(() => {
  exchange = cacheExchange();
  forwardMock.mockClear();
});

it('forwards to next exchange when no cache is found', async () => {
  forwardMock.mockReturnValue(of(queryResponse));
  await exchange(forwardMock)(of(queryOperation)).toPromise();

  expect(forwardMock).toHaveBeenCalledTimes(1);
});

it('caches queries', async () => {
  forwardMock.mockReturnValue(of(queryResponse));
  await exchange(forwardMock)(of(queryOperation)).toPromise();
  await exchange(forwardMock)(of(queryOperation)).toPromise();

  expect(forwardMock).toHaveBeenCalledTimes(1);
});

it("doesn't cache mutations", async () => {
  forwardMock.mockReturnValue(of(mutationResponse));
  await exchange(forwardMock)(of(mutationOperation)).toPromise();
  await exchange(forwardMock)(of(mutationOperation)).toPromise();

  expect(forwardMock).toHaveBeenCalledTimes(2);
});
