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
    alphabet @stream(initialCount: 3) {
      char
    }
  }

  ${SecondVerseFragment}
`;

const Song = React.memo(function Song({ song }) {
  return (
    <section>
      <p>{song.firstVerse}</p>
      <p>{song.secondVerse}</p>
    </section>
  );
});

const LocationsList = () => {
  const [result] = useQuery({
    query: SONGS_QUERY,
  });

  const { data } = result;

  return (
    <div>
      {data && (
        <>
          <Song song={data.song} />
          {data.alphabet.map(i => (
            <div key={i.char}>{i.char}</div>
          ))}
        </>
      )}
    </div>
  );
};

export default LocationsList;
