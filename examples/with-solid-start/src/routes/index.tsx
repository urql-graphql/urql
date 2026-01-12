import { Suspense, For, Show, createSignal } from 'solid-js';
import { createAsync } from '@solidjs/router';
import { gql } from '@urql/core';
import { createQuery, createMutation } from '@urql/solid-start';

const POKEMONS_QUERY = gql`
  query Pokemons {
    pokemons(limit: 10) {
      id
      name
    }
  }
`;

const ADD_POKEMON_MUTATION = gql`
  mutation AddPokemon($name: String!) {
    addPokemon(name: $name) {
      id
      name
    }
  }
`;

export default function Home() {
  const queryPokemons = createQuery(POKEMONS_QUERY, 'list-pokemons');
  const result = createAsync(() => queryPokemons());
  const [mutationState, addPokemon] = createMutation(ADD_POKEMON_MUTATION);
  const [pokemonName, setPokemonName] = createSignal('');

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const name = pokemonName();
    if (!name) return;

    const result = await addPokemon({ name });
    if (result.data) {
      setPokemonName('');
      // Note: In a real app, you'd want to refetch or update the cache
    }
  };

  return (
    <main style={{ padding: '20px', 'font-family': 'system-ui' }}>
      <h1>Pokemon List (SolidStart + URQL)</h1>

      <section style={{ 'margin-bottom': '20px' }}>
        <h2>Add Pokemon</h2>
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', gap: '10px', 'align-items': 'center' }}
        >
          <input
            type="text"
            value={pokemonName()}
            onInput={e => setPokemonName(e.currentTarget.value)}
            placeholder="Pokemon name"
            style={{ padding: '8px', 'font-size': '14px' }}
          />
          <button
            type="submit"
            disabled={mutationState.fetching}
            style={{
              padding: '8px 16px',
              'font-size': '14px',
              cursor: mutationState.fetching ? 'not-allowed' : 'pointer',
            }}
          >
            {mutationState.fetching ? 'Adding...' : 'Add Pokemon'}
          </button>
        </form>
        <Show when={mutationState.error}>
          <p style={{ color: 'red' }}>
            Error: {mutationState.error && mutationState.error.message}
          </p>
        </Show>
        <Show when={mutationState.data}>
          <p style={{ color: 'green' }}>
            Added: {mutationState.data.addPokemon.name}
          </p>
        </Show>
      </section>

      <section>
        <h2>Pokemon List</h2>
        <Suspense fallback={<p>Loading...</p>}>
          <Show when={result() && result()!.data}>
            <ul>
              <For each={result()!.data!.pokemons}>
                {pokemon => <li>{pokemon.name}</li>}
              </For>
            </ul>
          </Show>
        </Suspense>
      </section>
    </main>
  );
}
