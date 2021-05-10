import React from 'react';
import { gql, useQuery } from 'urql';

const LOCATIONS_QUERY = gql`
  query Locations($query: String!) {
    locations(query: $query) {
      id
      name
    }
  }
`;

const LocationsList = () => {
  const [result] = useQuery({
    query: LOCATIONS_QUERY,
    variables: { query: 'LON' },
  });

  const { data, fetching, error } = result;

  return (
    <div>
      {fetching && <p>Loading...</p>}

      {error && <p>Oh no... {error.message}</p>}

      {data && (
        <ul>
          {data.locations.map(location => (
            <li key={location.id}>{location.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LocationsList;
