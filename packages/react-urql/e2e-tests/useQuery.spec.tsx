/// <reference types="cypress" />

import * as React from 'react';
import { mount } from '@cypress/react';
import { Provider, createClient, gql, useQuery } from '../src';

const Boundary = props => {
  return (
    <React.Suspense fallback={<p id="suspense">Loading...</p>}>
      {props.children}
    </React.Suspense>
  );
};

const PokemonsQuery = gql`
  query($skip: Int!) {
    pokemons(limit: 10, skip: $skip) {
      id
      name
    }
  }
`;

const Pokemons = () => {
  const [skip, setSkip] = React.useState(0);
  const [result] = useQuery({ query: PokemonsQuery, variables: { skip } });

  return (
    <main>
      <ul id="pokemon-list">
        {result.data.pokemons.map(pokemon => (
          <li key={pokemon.id}>
            {pokemon.id}. {pokemon.name}
          </li>
        ))}
      </ul>
      {skip > 0 && (
        <button id="previous-page" onClick={() => setSkip(skip - 10)}>
          Previous Page
        </button>
      )}
      <button id="next-page" onClick={() => setSkip(skip + 10)}>
        Next Page
      </button>
    </main>
  );
};

describe('Suspense', () => {
  let UrqlProvider;
  beforeEach(() => {
    const client = createClient({
      url: 'https://trygql.formidable.dev/graphql/basic-pokedex',
      suspense: true,
    });

    // eslint-disable-next-line
    UrqlProvider = props => {
      return <Provider value={client}>{props.children}</Provider>;
    };
  });

  it('Suspends for a basic query', () => {
    mount(
      <UrqlProvider>
        <Boundary>
          <Pokemons />
        </Boundary>
      </UrqlProvider>
    );

    cy.get('#suspense').contains('Loading...');
    cy.get('#pokemon-list > li').then(items => {
      expect(items.length).to.equal(10);
    });
  });

  it('Suspends when changing variables', () => {
    mount(
      <UrqlProvider>
        <Boundary>
          <Pokemons />
        </Boundary>
      </UrqlProvider>
    );

    cy.get('#suspense').contains('Loading...');
    cy.get('#pokemon-list > li').then(items => {
      expect(items.length).to.equal(10);
    });

    cy.get('#next-page').click();
    cy.get('#suspense').contains('Loading...');
    cy.get('#pokemon-list > li').then(items => {
      expect(items.length).to.equal(10);
    });
  });

  it('Does not suspend for pages that already have been cached', () => {
    mount(
      <UrqlProvider>
        <Boundary>
          <Pokemons />
        </Boundary>
      </UrqlProvider>
    );

    cy.get('#suspense').contains('Loading...');
    cy.get('#pokemon-list > li').then(items => {
      expect(items.length).to.equal(10);
    });

    cy.get('#next-page').click();
    cy.get('#suspense').contains('Loading...');
    cy.get('#pokemon-list > li').then(items => {
      expect(items.length).to.equal(10);
    });

    cy.get('#previous-page').click();
    cy.get('#suspense').should('not.exist');
    cy.get('#pokemon-list > li').then(items => {
      expect(items.length).to.equal(10);
    });
  });

  it('does not cause an infinite loop with multiple components querying the same thing', () => {
    mount(
      <UrqlProvider>
        <Boundary>
          <Pokemons />
          <Pokemons />
          <Pokemons />
        </Boundary>
      </UrqlProvider>
    );

    cy.get('#suspense').contains('Loading...');
    cy.get('ul').then(items => {
      expect(items.length).to.equal(3);
    });
  });
});
