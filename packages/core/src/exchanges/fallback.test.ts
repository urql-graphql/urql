import { forEach, fromValue, pipe } from 'wonka';
import { vi, expect, it, beforeEach, afterAll } from 'vitest';

import { queryOperation, teardownOperation } from '../test-utils';
import { fallbackExchange } from './fallback';

const consoleWarn = console.warn;

const dispatchDebug = vi.fn();

beforeEach(() => {
  console.warn = vi.fn();
});

afterAll(() => {
  console.warn = consoleWarn;
});

it('filters all results and warns about input', () => {
  const res: any[] = [];

  pipe(
    fallbackExchange({ dispatchDebug })(fromValue(queryOperation)),
    forEach(x => res.push(x))
  );

  expect(res.length).toBe(0);
  expect(console.warn).toHaveBeenCalled();
});

it('filters all results and does not warn about teardown operations', () => {
  const res: any[] = [];

  pipe(
    fallbackExchange({ dispatchDebug })(fromValue(teardownOperation)),
    forEach(x => res.push(x))
  );

  expect(res.length).toBe(0);
  expect(console.warn).not.toHaveBeenCalled();
});
