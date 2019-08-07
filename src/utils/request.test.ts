import gql from 'graphql-tag';
import { createRequest } from './request';

const doc = gql`
  {
    todos {
      id
    }
  }
`;

it('should return a valid query object', () => {
  const val = createRequest(doc);

  expect(val.query).toBe(doc);
  expect(val).toMatchObject({
    key: expect.any(Number),
    query: expect.any(Object),
    variables: {},
  });
});

it('should return a valid query object with variables', () => {
  const val = createRequest(doc, { test: 5 });

  expect(val.query).toBe(doc);
  expect(val).toMatchObject({
    key: expect.any(Number),
    query: expect.any(Object),
    variables: { test: 5 },
  });
});
