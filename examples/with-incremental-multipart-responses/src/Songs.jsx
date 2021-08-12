import React from 'react';
import { gql, useQuery } from 'urql';

const SecondVerseFragment = gql`
  fragment secondVerseFields on Song {
    secondVerse
  }
`;

const SONGS_QUERY = gql`
  query App_Query {
    song {
      firstVerse
      ...secondVerseFields @defer
    }
    alphabet @stream(initial_count: 3) {
      char
    }
  }

  ${SecondVerseFragment}
`;

const LocationsList = () => {
  const [result] = useQuery({
    query: SONGS_QUERY,
  });

  const { data } = result;

  return (
    <div>
      {data && (
        <>
          <p>{data.song.firstVerse}</p>
          <p>{data.song.secondVerse}</p>
          {data.alphabet.map(i => (
            <div key={i.char}>{i.char}</div>
          ))}
        </>
      )}
    </div>
  );
};

export default LocationsList;
