import React, { useState } from 'react';
import { gql, useQuery } from 'urql';

const limit = 5;
const query = 'graphql';

const NPM_SEARCH = gql`
  query Search($query: String!, $first: Int!, $after: String) {
    search(query: $query, first: $first, after: $after) {
      nodes {
        id
        name
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const SearchResultPage = ({ variables, onLoadMore, isLastPage }) => {
  const [result] = useQuery({ query: NPM_SEARCH, variables });

  const { data, fetching, error } = result;

  const searchResults = data?.search;

  return (
    <div>
      {error && <p>Oh no... {error.message}</p>}

      {fetching && <p>Loading...</p>}

      {searchResults && (
        <>
          {searchResults.nodes.map(packageInfo => (
            <div key={packageInfo.id}>
              {packageInfo.id}: {packageInfo.name}
            </div>
          ))}

          {isLastPage && searchResults.pageInfo.hasNextPage && (
            <button
              onClick={() => onLoadMore(searchResults.pageInfo.endCursor)}
            >
              load more
            </button>
          )}
        </>
      )}
    </div>
  );
};

const PaginatedNpmSearch = () => {
  const [pageVariables, setPageVariables] = useState([
    {
      query,
      first: limit,
      after: '',
    },
  ]);

  return (
    <div>
      {pageVariables.map((variables, i) => (
        <SearchResultPage
          key={'' + variables.after}
          variables={variables}
          isLastPage={i === pageVariables.length - 1}
          onLoadMore={after =>
            setPageVariables([...pageVariables, { after, first: limit, query }])
          }
        />
      ))}
    </div>
  );
};

export default PaginatedNpmSearch;
