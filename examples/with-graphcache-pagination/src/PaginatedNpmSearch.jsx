import React, { useState } from 'react';
import { gql, useQuery } from 'urql';

const limit = 5;
const query = 'graphql';

const NPM_SEARCH = gql`
  query Search($query: String!, $first: Int!, $after: String) {
    search(query: $query, first: $first, after: $after) {
      edges {
        node {
          id
          name
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const PaginatedNpmSearch = () => {
  const [after, setAfter] = useState('');

  const [result] = useQuery({
    query: NPM_SEARCH,
    variables: { query, first: limit, after },
  });

  const { data, fetching, error } = result;

  const searchResults = data?.search;

  return (
    <div>
      {error && <p>Oh no... {error.message}</p>}

      {fetching && <p>Loading...</p>}

      {searchResults && (
        <>
          {searchResults.edges.map(({ node }) => (
            <div key={node.id}>
              {node.id}: {node.name}
            </div>
          ))}

          {searchResults.pageInfo.hasNextPage && (
            <button onClick={() => setAfter(searchResults.pageInfo.endCursor)}>
              load more
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default PaginatedNpmSearch;
