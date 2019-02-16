import gql from 'graphql-tag';
import { getKeyForQuery } from './keyForQuery';

const consoleWarn = console.warn;

beforeEach(() => {
  console.warn = jest.fn();
});

afterAll(() => {
  console.warn = consoleWarn;
});

it('returns consistent hashes for strings', () => {
  expect(getKeyForQuery('test')).toBe(getKeyForQuery('test'));
  expect(getKeyForQuery('test')).not.toBe(getKeyForQuery('test2'));
  expect(getKeyForQuery('test')).toMatchSnapshot();
});

it('returns consistent hashes for DocumentNodes', () => {
  const query = gql`
    query Test {
      test
    }
  `;

  const different = gql`
    query TestB {
      test2
    }
  `;

  expect((query as any).__key).toBe(undefined);

  expect(getKeyForQuery(query)).toBe(getKeyForQuery(query));
  expect(getKeyForQuery(query)).not.toBe(getKeyForQuery(different));

  expect((query as any).__key).toBe(getKeyForQuery(query));
});

it('guesses the same hash for similar DocumentNodes', () => {
  const query = () => gql`
    query Test {
      test
    }
  `;

  const different = () => gql`
    query TestB {
      test2
    }
  `;

  expect(getKeyForQuery(query())).toBe(getKeyForQuery(query()));
  expect(getKeyForQuery(query())).not.toBe(getKeyForQuery(different()));
});

it('guesses the same hash for unnamed but similar DocumentNodes', () => {
  const query = () => gql`
    {
      test
    }
  `;

  const different = () => gql`
    {
      test2
    }
  `;

  expect(getKeyForQuery(query())).toBe(getKeyForQuery(query()));
  expect(getKeyForQuery(query())).not.toBe(getKeyForQuery(different()));
});

it('warns about different queries having identical names', () => {
  const query = gql`
    query SameName {
      test
    }
  `;

  const different = gql`
    query SameName {
      test2
    }
  `;

  // This is expected but obviously problematic
  expect(getKeyForQuery(query)).toBe(getKeyForQuery(different));

  expect(console.warn).toHaveBeenCalled();
});
