/* eslint-disable */
require('isomorphic-fetch');
const { createClient, createRequest } = require('../../core');
const gql = require('graphql-tag');
const { pipe, subscribe } = require('wonka');

const client = createClient({
  url: 'https://graphbrainz.herokuapp.com/graphql',
});

const query = gql`
  query SearchArtist($search: String!) {
    search {
      artists(query: $search, first: 1) {
        edges {
          node {
            name
            country
            releases(first: 10) {
              edges {
                node {
                  title
                  date
                  media {
                    format
                    trackCount
                    tracks {
                      title
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

const request = createRequest(query, { search: 'Courtney Barnett' });

pipe(
  client.executeQuery(request),
  subscribe(({ data, error }) => {
    if (error) {
      console.warn('Error', error);
    }

    console.log('Data', JSON.stringify(data, ' ', 2));
  })
);
