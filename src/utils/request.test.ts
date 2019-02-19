import { createRequest } from './request';

it('should return a valid query object', () => {
  const val = createRequest(`{ todos { id } }`);
  expect(val).toMatchObject({ query: `{ todos { id } }`, variables: {} });
});

it('should return a valid query object with variables', () => {
  const val = createRequest(`{ todos { id } }`, { test: 5 });

  expect(val.query).toBe(`{ todos { id } }`);
  expect(val.variables).toMatchObject({ test: 5 });
  expect(typeof val.key).toBe('number');
});
