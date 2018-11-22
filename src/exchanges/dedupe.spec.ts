import { of, Observable } from 'rxjs';
import { dedupeExchange } from './dedupe';
import {
  queryResponse,
  queryOperation,
  mutationResponse,
  mutationOperation,
} from '../util/samples';

let exchange = dedupeExchange();
const forwardMock = jest.fn();

beforeEach(() => {
  exchange = dedupeExchange();
  forwardMock.mockClear();
});

it('forwards to next exchange when no call is in progress', async () => {
  forwardMock.mockReturnValue(of(queryResponse));
  await exchange(forwardMock)(of(queryOperation)).toPromise();

  expect(forwardMock).toHaveBeenCalledTimes(1);
});

it('returns existing request when call is already in progress', async () => {
  forwardMock.mockReturnValue(
    new Observable(observer => {
      setTimeout(() => {
        observer.next(queryResponse);
        observer.complete();
      }, 200);
    })
  );

  await Promise.all([
    exchange(forwardMock)(of(queryOperation)).toPromise(),
    exchange(forwardMock)(of(queryOperation)).toPromise(),
  ]);

  expect(forwardMock).toHaveBeenCalledTimes(1);
});

it('creates a new request when mutation call is in progress', async () => {
  forwardMock.mockReturnValue(
    new Observable(observer => {
      setTimeout(() => {
        observer.next(mutationResponse);
        observer.complete();
      }, 200);
    })
  );

  await Promise.all([
    exchange(forwardMock)(of(mutationOperation)).toPromise(),
    exchange(forwardMock)(of(mutationOperation)).toPromise(),
  ]);

  expect(forwardMock).toHaveBeenCalledTimes(2);
});
