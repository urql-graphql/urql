import { forEach, fromValue, pipe } from 'wonka';
import { queryOperation, teardownOperation } from '../test-utils';
import { fallbackExchangeIO } from './fallback';

const consoleWarn = console.warn;

beforeEach(() => {
  console.warn = jest.fn();
});

afterAll(() => {
  console.warn = consoleWarn;
});

it('filters all results and warns about input', () => {
  const res: any[] = [];

  pipe(
    fallbackExchangeIO(fromValue(queryOperation)),
    forEach(x => res.push(x))
  );

  expect(res.length).toBe(0);
  expect(console.warn).toHaveBeenCalled();
});

it('filters all results and warns about input', () => {
  const res: any[] = [];

  pipe(
    fallbackExchangeIO(fromValue(teardownOperation)),
    forEach(x => res.push(x))
  );

  expect(res.length).toBe(0);
  expect(console.warn).not.toHaveBeenCalled();
});
