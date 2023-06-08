import React, { useCallback } from 'react';
import { gql, useQuery } from 'urql';

// We define a fragment, just to define the data
// that our item component will use in the results list
const packageFragment = gql`
  fragment SearchPackage on Package {
    id
    name
    latest: version(selector: "latest") {
      version
    }
  }
`;

// The main query fetches the first page of results and gets our `PageInfo`
// This tells us whether more pages are present which we can query.
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

// We split the next pages we load into a separate query. In this example code,
// both queries could be the same, but we keep them separate for educational
// purposes.
// In a real app, your "root query" would often fetch more data than the search page query.
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

// This is the <SearchRoot> component that we render in `./App.jsx`.
// It accepts our variables as props.
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

  // Here, we render the results as a list into a fragment, and if `hasNextPage`
  // is truthy, we immediately render <SearchPage> for the next page.
  const connection = rootResult.data?.search;
  return (
    <>
      {connection?.edges?.length === 0 ? <strong>No Results</strong> : null}

      {connection?.edges.map(edge => (
        <Package key={edge.cursor} node={edge.node} />
      ))}

      {/* The <SearchPage> component receives the same props, plus the `afterCursor` for its variables */}
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

// The <SearchPage> is rendered for each page of results, except for the root query.
// It renders *itself* recursively, for the next page of results.
const SearchPage = ({ searchTerm, resultsPerPage, afterCursor }) => {
  // Each <SearchPage> fetches its own page results!
  const [pageResult, executeQuery] = useQuery({
    query: pageQuery,
    // Initially, we *only* want to display results if, they're cached
    requestPolicy: 'cache-only',
    // We don't want to run the query if we don't have a cursor (in this example, this will never happen)
    pause: !afterCursor,
    variables: {
      searchTerm,
      resultsPerPage,
      afterCursor,
    },
  });

  // We only load more results, by allowing the query to make a network request, if
  // a button has pressed.
  // In your app, you may want to do this automatically if the user can see the end of
  // your list, e.g. via an IntersectionObserver.
  const onLoadMore = useCallback(() => {
    // This tells the query above to execute and instead of `cache-only`, which forbids
    // network requests, we now allow them.
    executeQuery({ requestPolicy: 'cache-first' });
  }, [executeQuery]);

  if (pageResult.fetching) {
    return <em>Loading...</em>;
  }

  const connection = pageResult.data?.search;
  return (
    <>
      {/* If our query has nodes, we render them here. The page renders its own results */}
      {connection?.edges.map(edge => (
        <Package key={edge.cursor} node={edge.node} />
      ))}

      {/* If we have a next page, we now render it recursively! */}
      {/* As before, the next <SearchPage> will not fetch immediately, but only query from cache */}
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

// This is the component that then renders each result item
const Package = ({ node }) => (
  <section>
    <strong>{node.name}</strong>
    <em>@{node.latest.version}</em>
  </section>
);

export default SearchRoot;
