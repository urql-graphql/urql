import { gql } from '@urql/core';
import { renderHook } from '@testing-library/react-hooks';
import { useRequest } from './useRequest';

it('preserves instance of request when key has not changed', () => {
  const query = gql`
    query getUser($name: String) {
      user(name: $name) {
        id
        firstName
        lastName
      }
    }
  `;

  let variables = {
    name: 'Clara',
  };

  const { result, rerender } = renderHook(
    ({ query, variables }) => useRequest(query, variables),
    { initialProps: { query, variables } }
  );

  const resultA = result.current;
  expect(resultA).toEqual({
    key: expect.any(Number),
    query: expect.anything(),
    variables: variables,
  });

  variables = { ...variables }; // Change reference
  rerender({ query, variables });

  const resultB = result.current;
  expect(resultA).toBe(resultB);

  variables = { ...variables, test: true } as any; // Change values
  rerender({ query, variables });

  const resultC = result.current;
  expect(resultA).not.toBe(resultC);
});
