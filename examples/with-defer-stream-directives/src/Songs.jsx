import React, { Suspense } from 'react';
import { gql, useQuery, useFragment } from 'urql';

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
  }

  ${SecondVerseFragment}
`;

const Song = React.memo(function Song({ song }) {
  return (
    <section>
      <p>{song.firstVerse}</p>
      <Suspense fallback={'Loading song 2...'}>
        <DeferredSong data={song} />
      </Suspense>
      <p>{song.secondVerse}</p>
    </section>
  );
});

const DeferredSong = ({ data }) => {
  console.log(data, SecondVerseFragment)
  const result = useFragment({
    query: SecondVerseFragment,
    data,
  });
  return <p>{result.secondVerse}</p>;
};

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
        </>
      )}
    </div>
  );
};

export default LocationsList;
