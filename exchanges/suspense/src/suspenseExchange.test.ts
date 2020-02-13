import {
  pipe,
  map,
  fromValue,
  fromArray,
  toArray,
  makeSubject,
  forEach,
  delay,
} from 'wonka';

import { createClient, Operation, OperationResult } from 'urql';
import { suspenseExchange } from './suspenseExchange';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

it('logs a warning if suspense mode is not activated', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => { /* noop */ });
  const client = createClient({ url: 'https://example.com', suspense: false });
  const forward = jest.fn(() => fromArray([]));
  const ops = fromArray([]);

  suspenseExchange({ client, forward })(ops);
  expect(forward).toHaveBeenCalledWith(ops);
  expect(warn).toHaveBeenCalled();
  warn.mockRestore();
});

it('forwards skipped operations', () => {
  const client = createClient({ url: 'https://example.com', suspense: true });
  const operation = client.createRequestOperation('mutation', {
    key: 123,
    query: {} as any,
  });
  const forward = ops =>
    pipe(
      ops,
      map(operation => ({ operation } as OperationResult))
    );

  const res = pipe(
    suspenseExchange({ client, forward })(fromValue(operation)),
    toArray
  );

  expect(res).toEqual([{ operation }]);
});

it('resolves synchronous results immediately', () => {
  let prevResult;

  const client = createClient({ url: 'https://example.com', suspense: true });
  const operation = client.createRequestOperation('query', {
    key: 123,
    query: {} as any,
  });
  const resolveResult = jest.fn(
    operation => ({ operation } as OperationResult)
  );
  const forward = ops =>
    pipe(
      ops,
      map(resolveResult)
    );
  const { source: ops, next: dispatch } = makeSubject<Operation>();

  pipe(
    suspenseExchange({ client, forward })(ops),
    forEach(result => (prevResult = result))
  );

  dispatch(operation);
  expect(prevResult).toEqual({ operation });
  prevResult = undefined;

  dispatch(operation);
  expect(prevResult).toEqual({ operation });
  prevResult = undefined;

  expect(resolveResult).toHaveBeenCalledTimes(2);
});

it('caches asynchronous results once for suspense', () => {
  let prevResult;

  const client = createClient({ url: 'https://example.com', suspense: true });
  const operation = client.createRequestOperation('query', {
    key: 123,
    query: {} as any,
  });
  const resolveResult = jest.fn(
    operation => ({ operation } as OperationResult)
  );
  const forward = ops =>
    pipe(
      ops,
      delay(1),
      map(resolveResult)
    );
  const { source: ops, next: dispatch } = makeSubject<Operation>();

  pipe(
    suspenseExchange({ client, forward })(ops),
    forEach(result => (prevResult = result))
  );

  dispatch(operation);
  expect(resolveResult).toHaveBeenCalledTimes(0); // Delayed so not called yet
  expect(prevResult).toBe(undefined);

  jest.advanceTimersByTime(1);

  expect(resolveResult).toHaveBeenCalledTimes(1); // Called after timer advanced
  expect(prevResult).toEqual({ operation });
  prevResult = undefined;

  dispatch(operation);
  expect(resolveResult).toHaveBeenCalledTimes(1); // Not called again due to suspense cache
  expect(prevResult).toEqual({ operation });
});
