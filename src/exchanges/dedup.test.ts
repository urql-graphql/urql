import { Observable, Subject } from 'rxjs';
import { map, delay } from 'rxjs/operators';
import { dedupeExchange } from './dedup';
import {
  queryResponse,
  queryOperation,
  mutationResponse,
  mutationOperation,
} from '../test-utils';
import { Operation } from '../types';

let stream = new Subject<Operation>();
let calls = 0;
let response = queryResponse;

const forward = (s: Observable<Operation>) =>
  s.pipe(
    map(() => {
      calls += 1;
      return response;
    }),
    delay(200)
  );

beforeEach(() => {
  calls = 0;
  response = queryResponse;
  stream = new Subject<Operation>();
});

it('forwards to next exchange when no operation is found', async () => {
  // @ts-ignore
  const exchange = dedupeExchange({ forward })(stream);
  const completed = exchange.toPromise();

  stream.next(queryOperation);
  stream.complete();
  await completed;

  expect(calls).toBe(1);
});

it('does not forward to next exchange when existing operation is found', async () => {
  // @ts-ignore
  const exchange = dedupeExchange({ forward })(stream);
  const completed = exchange.toPromise();

  stream.next(queryOperation);
  stream.next(queryOperation);
  stream.complete();
  await completed;

  expect(calls).toBe(1);
});

it('creates a new request when mutation call is in progress', async () => {
  response = mutationResponse;

  // @ts-ignore
  const exchange = dedupeExchange({ forward })(stream);
  const completed = exchange.toPromise();

  stream.next(mutationOperation);
  stream.next(mutationOperation);
  stream.complete();
  await completed;

  expect(calls).toBe(2);
});
