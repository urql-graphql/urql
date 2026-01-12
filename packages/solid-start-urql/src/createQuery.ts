import {
  type AnyVariables,
  type DocumentInput,
  type OperationContext,
  type RequestPolicy,
  createRequest,
  type Client,
} from '@urql/core';
import { useClient, useQuery } from './context';

/**
 * Creates a cached query function using SolidStart's query primitive.
 *
 * @remarks
 * This function creates a reusable query function that executes a GraphQL query.
 * It uses SolidStart's query primitive for caching and deduplication.
 * Call this at module level, then use the returned function with createAsync in your component.
 *
 * @example
 * ```tsx
 * import { createQuery } from '@urql/solid-start';
 * import { createAsync } from '@solidjs/router';
 * import { gql } from '@urql/core';
 *
 * const POKEMONS_QUERY = gql`
 *   query Pokemons {
 *     pokemons(limit: 10) {
 *       id
 *       name
 *     }
 *   }
 * `;
 *
 * const queryPokemons = createQuery(POKEMONS_QUERY, 'list-pokemons');
 *
 * export default function PokemonList() {
 *   const client = useClient();
 *   const pokemons = createAsync(() => queryPokemons(client));
 *
 *   return (
 *     <Show when={pokemons()?.data}>
 *       <For each={pokemons()!.data.pokemons}>
 *         {pokemon => <li>{pokemon.name}</li>}
 *       </For>
 *     </Show>
 *   );
 * }
 * ```
 */
export function createQuery<
  Data = any,
  Variables extends AnyVariables = AnyVariables,
>(
  queryDocument: DocumentInput<Data, Variables>,
  key: string,
  options?: {
    variables?: Variables;
    requestPolicy?: RequestPolicy;
    context?: Partial<OperationContext>;
  }
) {
  // Get the query function from context
  const queryFn = useQuery();

  // Return the result of calling the query function
  return queryFn(
    async (
      clientOrVariables?: Client | Variables,
      variablesOrContext?: Variables | Partial<OperationContext>,
      contextOverride?: Partial<OperationContext>
    ) => {
      // Determine if first arg is client or variables
      let client: Client;
      let variables: Variables | undefined;
      let context: Partial<OperationContext> | undefined;

      if (
        clientOrVariables &&
        typeof (clientOrVariables as any).executeQuery === 'function'
      ) {
        // First arg is client
        client = clientOrVariables as Client;
        variables = variablesOrContext as Variables | undefined;
        context = contextOverride;
      } else {
        // First arg is variables (or nothing), use useClient
        client = useClient();
        variables = clientOrVariables as Variables | undefined;
        context = variablesOrContext as Partial<OperationContext> | undefined;
      }

      const finalVariables = variables ?? options?.variables;
      const request = createRequest(queryDocument, finalVariables as Variables);
      const finalContext: Partial<OperationContext> = {
        requestPolicy: options?.requestPolicy,
        ...options?.context,
        ...context,
      };

      return await client.executeQuery(request, finalContext).toPromise();
    },
    key
  );
}
