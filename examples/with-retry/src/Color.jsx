import React from 'react';
import { gql, useQuery } from 'urql';

const RANDOM_COLOR_QUERY = gql`
  query RandomColor {
    randomColor {
      name
      hex
    }
  }
`;

const RandomColorDisplay = () => {
  const [result] = useQuery({ query: RANDOM_COLOR_QUERY });

  const { data, fetching, error } = result;

  return (
    <div>
      {fetching && <p>Loading...</p>}

      {error && <p>Oh no... {error.message}</p>}

      {data && (
        <div style={{ backgroundColor: data.randomColor.hex }}>
          {data.randomColor.name}
        </div>
      )}

      {result.operation && (
        <p>
          To get a result, the retry exchange retried:{' '}
          {result.operation.context.retryCount || 0} times.
        </p>
      )}
    </div>
  );
};

export default RandomColorDisplay;
