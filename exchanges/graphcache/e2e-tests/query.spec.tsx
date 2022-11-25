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
});
