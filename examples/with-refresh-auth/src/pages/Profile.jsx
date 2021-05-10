import React from 'react';
import { gql, useQuery } from 'urql';

const PROFILE_QUERY = gql`
  query Profile {
    me {
      id
      username
      createdAt
    }
  }
`;

const Profile = () => {
  const [result] = useQuery({ query: PROFILE_QUERY });

  const { data, fetching, error } = result;

  return (
    <div>
      {fetching && <p>Loading...</p>}

      {error && <p>Oh no... {error.message}</p>}

      {data?.me && (
        <>
          <p>profile data</p>
          <p>id: {data.me.id}</p>
          <p>username: {data.me.username}</p>
        </>
      )}
    </div>
  );
};

export default Profile;
