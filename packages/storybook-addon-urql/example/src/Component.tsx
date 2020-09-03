import React from 'react';
import { useQuery } from 'urql';
import gql from 'graphql-tag';

export const Component = () => {
  const [{ fetching, data, error }] = useQuery<{
    user: { id: number; name: string };
  }>({
    query: gql`
      query GetUsers {
        user {
          id
        }
      }
    `,
  });

  if (fetching) {
    return 'Fetching';
  }

  if (error) {
    return 'Error';
  }

  return (
    <>
      <h1>User</h1>
      <p>ID: {data.user.id}</p>
      <p>Name: {data.user.name}</p>
    </>
  );
};
