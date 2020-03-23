import { forEach, fromValue, pipe } from 'wonka';
import { queryOperation, teardownOperation } from '../test-utils';
import { fallbackExchange } from './fallback';

const consoleWarn = console.warn;

const client = {
  debugTarget: {
    dispatchEvent: jest.fn(),
  },
} as any;

beforeEach(() => {
  console.warn = jest.fn();
});

afterAll(() => {
  console.warn = consoleWarn;
});

it('filters all results and warns about input', () => {
  const res: any[] = [];

  pipe(
    fallbackExchange({ client })(fromValue(queryOperation)),
    forEach(x => res.push(x))
  );

  expect(res.length).toBe(0);
  expect(console.warn).toHaveBeenCalled();
});

it('filters all results and warns about input', () => {
  const res: any[] = [];

  pipe(
    fallbackExchange({ client })(fromValue(teardownOperation)),
    forEach(x => res.push(x))
  );

  expect(res.length).toBe(0);
  expect(console.warn).not.toHaveBeenCalled();
});
