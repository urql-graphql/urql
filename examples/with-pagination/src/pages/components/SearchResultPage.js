import React from "react";
import { gql, useQuery } from "urql";

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

const SearchResultPage = ({ variables, onLoadMore, isLastPage }) => {
  const [result] = useQuery({ query: NPM_SEARCH, variables });

  const { data, fetching, error } = result;

  const searchResults = data?.search;

  return (
    <div>
      {error && <p>Oh no... {error.message}</p>}

      {fetching && <p>Loading...</p>}

      {searchResults && (
        <>
          {searchResults.nodes.map((packageInfo) => (
            <div key={packageInfo.id}>{packageInfo.id}: {packageInfo.name}</div>
          ))}

          {isLastPage && searchResults.pageInfo.hasNextPage && (
            <button onClick={() => onLoadMore(searchResults.pageInfo.endCursor)}>
              load more
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default SearchResultPage;
