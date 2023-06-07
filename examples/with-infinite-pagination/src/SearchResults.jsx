import React, { useCallback } from 'react';
import { gql, useQuery } from 'urql';

const packageFragment = gql`
  fragment SearchPackage on Package {
    id
    name
    latest: version(selector: "latest") {
      version
    }
  }
`;

const rootQuery = gql`
  query SearchRoot($searchTerm: String!, $resultsPerPage: Int!) {
    search(query: $searchTerm, first: $resultsPerPage) {
      edges {
        cursor
        node {
          ...SearchPackage
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }

  ${packageFragment}
`;

const pageQuery = gql`
  query SearchPage(
    $searchTerm: String!
    $resultsPerPage: Int!
    $afterCursor: String!
  ) {
    search(query: $searchTerm, first: $resultsPerPage, after: $afterCursor) {
      edges {
        cursor
        node {
          ...SearchPackage
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }

  ${packageFragment}
`;

const SearchRoot = ({ searchTerm = 'urql', resultsPerPage = 10 }) => {
  const [rootResult] = useQuery({
    query: rootQuery,
    variables: {
      searchTerm,
      resultsPerPage,
    },
  });

  if (rootResult.fetching) {
    return <em>Loading...</em>;
  }

  const connection = rootResult.data?.search;
  return (
    <>
      {connection?.edges?.length === 0 ? <strong>No Results</strong> : null}

      {connection?.edges.map(edge => (
        <Package key={edge.cursor} node={edge.node} />
      ))}

      {connection?.pageInfo.hasNextPage ? (
        <SearchPage
          searchTerm={searchTerm}
          resultsPerPage={resultsPerPage}
          afterCursor={connection.pageInfo.endCursor}
        />
      ) : rootResult.fetching ? (
        <em>Loading...</em>
      ) : null}
    </>
  );
};

const SearchPage = ({ searchTerm, resultsPerPage, afterCursor }) => {
  const [pageResult, executeQuery] = useQuery({
    query: pageQuery,
    requestPolicy: 'cache-only',
    pause: !afterCursor,
    variables: {
      searchTerm,
      resultsPerPage,
      afterCursor,
    },
  });

  const onLoadMore = useCallback(() => {
    executeQuery({ requestPolicy: 'cache-first' });
  }, [executeQuery]);

  if (pageResult.fetching) {
    return <em>Loading...</em>;
  }

  const connection = pageResult.data?.search;
  return (
    <>
      {connection?.edges.map(edge => (
        <Package key={edge.cursor} node={edge.node} />
      ))}

      {connection?.pageInfo.hasNextPage ? (
        <SearchPage
          searchTerm={searchTerm}
          resultsPerPage={resultsPerPage}
          afterCursor={connection.pageInfo.endCursor}
        />
      ) : pageResult.fetching ? (
        <em>Loading...</em>
      ) : null}

      {!connection && !pageResult.fetching ? (
        <button type="button" onClick={onLoadMore}>
          Load more
        </button>
      ) : null}
    </>
  );
};

const Package = ({ node }) => (
  <section>
    <strong>{node.name}</strong>
    <em>@{node.latest.version}</em>
  </section>
);

export default SearchRoot;
