import {
  pipe,
  onStart,
  onPush,
  onEnd,
  fromValue,
  fromArray,
  makeSubject,
  never,
  publish,
  subscribe,
} from 'wonka';

import { toSuspenseSource } from './toSuspenseSource';

it('does nothing when not subscribed to', () => {
  const start = jest.fn();

  pipe(fromValue('test'), onStart(start), toSuspenseSource);

  expect(start).not.toHaveBeenCalled();
});

it('resolves synchronously when the source resolves synchronously', () => {
  const start = jest.fn();
  const push = jest.fn();
  let result;

  pipe(
    fromValue('test'),
    onStart(start),
    onPush(push),
    toSuspenseSource,
    subscribe(value => {
      result = value;
    })
  );

  expect(result).toBe('test');
  expect(start).toHaveBeenCalledTimes(1);
  expect(push).toHaveBeenCalledTimes(1);
});

it('throws a promise when the source is not resolving immediately', () => {
  expect(() => {
    pipe(never, toSuspenseSource as any, publish);
  }).toThrow(expect.any(Promise));
});

it('throws a promise that resolves when the source emits a value', () => {
  const { source, next } = makeSubject();
  const end = jest.fn();

  let promise;
  let result;

  try {
    pipe(
      source,
      toSuspenseSource,
      onEnd(end),
      subscribe(value => {
        expect(value).toBe('test');
        result = value;
      })
    );
  } catch (error) {
    promise = error;
  }

  // Expect it to have thrown
  expect(promise).toBeInstanceOf(Promise);

  next('test');

  // The result came in asynchronously and the original source has ended
  expect(result).toBe(undefined);

  return promise.then(resolved => {
    expect(resolved).toBe('test');
    expect(end).toHaveBeenCalled();
  });
});

it('behaves like a normal source when the first result was synchronous', async () => {
  const push = jest.fn();
  await new Promise(resolve => {
    pipe(fromArray([1, 2]), toSuspenseSource, onEnd(resolve), subscribe(push));
  });

  expect(push).toHaveBeenCalledTimes(2);
});

it('still supports cancellation', async () => {
  let unsubscribe;
  const end = jest.fn();

  try {
    ({ unsubscribe } = pipe(
      fromArray([1, 2]),
      toSuspenseSource,
      onEnd(end),
      publish
    ));
  } catch (promise) {
    expect(promise).toBe(expect.any(Promise));
  }

  unsubscribe();
  expect(end).toHaveBeenCalledTimes(1);
});
