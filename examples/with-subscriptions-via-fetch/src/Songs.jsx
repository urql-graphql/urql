import React from 'react';
import { gql, useQuery, useSubscription } from 'urql';

const LIST_QUERY = gql`
  query List_Query {
    list {
      char
    }
  }
`;

const SONG_SUBSCRIPTION = gql`
  subscription App_Subscription {
    alphabet {
      char
    }
  }
`;

const ListQuery = () => {
  const [listResult] = useQuery({
    query: LIST_QUERY,
  });
  return (
    <div>
      <h3>List</h3>
      {listResult?.data?.list.map(i => (
        <div key={i.char}>{i.char}</div>
      ))}
    </div>
  );
};

const SongSubscription = () => {
  const [songsResult] = useSubscription(
    { query: SONG_SUBSCRIPTION },
    (prev = [], data) => [...prev, data.alphabet]
  );

  return (
    <div>
      <h3>Song</h3>
      {songsResult?.data?.map(i => (
        <div key={i.char}>{i.char}</div>
      ))}
    </div>
  );
};

const LocationsList = () => {
  return (
    <>
      <ListQuery />
      <SongSubscription />
    </>
  );
};

export default LocationsList;
