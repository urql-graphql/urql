import { print } from 'graphql';
import gql from 'graphql-tag';
import { createRequest } from './request';

const doc = print(
  gql`
    {
      todos {
        id
      }
    }
  `
);

it('should return a valid query object', () => {
  const val = createRequest(doc);

  expect(print(val.query)).toBe(doc);
  expect(val).toMatchObject({
    key: expect.any(Number),
    query: expect.any(Object),
    variables: {},
  });
});

it('should return a valid query object with variables', () => {
  const val = createRequest(doc, { test: 5 });

  expect(print(val.query)).toBe(doc);
  expect(val).toMatchObject({
    key: expect.any(Number),
    query: expect.any(Object),
    variables: { test: 5 },
  });
});
