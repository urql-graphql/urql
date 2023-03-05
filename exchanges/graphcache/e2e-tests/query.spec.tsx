/// <reference types="cypress" />

import * as React from 'react';
import { mount } from '@cypress/react';
import {
  Provider,
  createClient,
  useQuery,
  dedupExchange,
  debugExchange,
} from 'urql';
import { executeExchange } from '@urql/exchange-execute';
import { buildSchema, introspectionFromSchema } from 'graphql';

import { cacheExchange } from '../src';

const schema = buildSchema(`
  type Query {
    movie: Movie
  }

  type Movie {
    id: String
    title: String
    metadata: Metadata
  }

  type Metadata {
    uri: String
  }
`);

const rootValue = {
  movie: () => {
    return {
      id: 'foo',
      title: 'title',
      metadata: () => {
        throw new Error('Test');
      },
    };
  },
};

describe('Graphcache Queries', () => {
  it('should not loop with no schema present', () => {
    const client = createClient({
      url: 'https://trygql.formidable.dev/graphql/basic-pokedex',
      exchanges: [
        dedupExchange,
        cacheExchange({}),
        debugExchange,
        executeExchange({ schema, rootValue }),
      ],
    });

    const FirstComponent = () => {
      const [{ fetching, error }] = useQuery({
        query: `{
          movie {
            id
            title
            metadata {
              uri
            }
          }
        }`,
      });

      return (
        <div>
          {fetching === true ? (
            'loading'
          ) : (
            <div>
              <div>First Component</div>
              <div id="first-error">{`Error: ${error?.message}`}</div>
            </div>
          )}
        </div>
      );
    };

    const SecondComponent = () => {
      const [{ error, fetching }] = useQuery({
        query: `{
          movie {
            id
            metadata {
              uri
            }
          }
        }`,
      });

      if (fetching) {
        return <div>Loading...</div>;
      }

      return (
        <div>
          <div>Second Component</div>
          <div id="second-error">{`Error: ${error?.message}`}</div>
        </div>
      );
    };

    mount(
      <Provider value={client}>
        <FirstComponent />
        <SecondComponent />
      </Provider>
    );

    cy.get('#first-error').should('have.text', 'Error: [GraphQL] Test');
    cy.get('#second-error').should('have.text', 'Error: [GraphQL] Test');
  });

  it('should not loop with schema present', () => {
    const client = createClient({
      url: 'https://trygql.formidable.dev/graphql/basic-pokedex',
      exchanges: [
        dedupExchange,
        cacheExchange({ schema: introspectionFromSchema(schema) }),
        debugExchange,
        executeExchange({ schema, rootValue }),
      ],
    });

    const FirstComponent = () => {
      const [{ fetching, data, error, stale }] = useQuery({
        query: `{
          movie {
            id
            title
            metadata {
              uri
            }
          }
        }`,
      });

      return (
        <div>
          {fetching === true ? (
            'loading'
          ) : (
            <div>
              <div>First Component</div>
              <div id="first-data">{`Data: ${data.movie?.title}`}</div>
              <div id="first-error">{`Error: ${error?.message}`}</div>
              <div id="first-stale">{`Stale: ${!!stale}`}</div>
            </div>
          )}
        </div>
      );
    };

    const SecondComponent = () => {
      const [{ error, data, fetching, stale }] = useQuery({
        query: `{
          movie {
            id
            metadata {
              uri
            }
          }
        }`,
      });

      if (fetching) {
        return <div>Loading...</div>;
      }

      return (
        <div>
          <div>Second Component</div>
          <div id="second-data">{`Data: ${data.movie.id}`}</div>
          <div id="second-error">{`Error: ${error?.message}`}</div>
          <div id="second-stale">{`Stale: ${!!stale}`}</div>
        </div>
      );
    };

    mount(
      <Provider value={client}>
        <FirstComponent />
        <SecondComponent />
      </Provider>
    );

    cy.get('#first-data').should('have.text', 'Data: title');
    cy.get('#second-data').should('have.text', 'Data: foo');
    cy.get('#second-stale').should('have.text', 'Stale: true');
    // TODO: ideally we would be able to keep the error here but...
    // cy.get('#first-error').should('have.text', 'Error: [GraphQL] Test');
    // cy.get('#second-error').should('have.text', 'Error: [GraphQL] Test');
  });
});
