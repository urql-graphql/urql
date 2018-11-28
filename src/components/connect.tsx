import React, { ReactNode } from 'react';
import { ChildArgs, Client, Cache, Query, Mutation } from '../types';
import { UrqlClient } from './client';
import { ContextConsumer } from './context';

export interface ConnectProps<T> {
  /** A function which receives values from the URQL client. */
  children: (props: ChildArgs<T>) => ReactNode;
  /** The GraphQL query to fetch */
  query?: Query;
  /** A collection of GrahpQL mutation queries */
  mutation?: { [type in keyof T]: Mutation };
}

// This is the type used for the Render Prop. It requires
// one generic so that TypeScript can properly infer the shape
// of data and an optional second generic to describe the mutations
// that will be made available.
// Note: The following verbose comments are for TypeScript user's autocomplete.

/**
 * Urql's render props.
 */
export type UrqlProps<Data, Mutations = {}> = {
  /**
   * Urql cache
   */
  cache: Cache;
  /**
   * The data returned by your Urql query.
   */
  data: Data | null;
  /**
   * Query error, if present.
   */
  error: any;
  /**
   * Returns true if Urql is fetching data
   */
  fetching: boolean;
  /**
   * This is like loading but it's false by default, and becomes true after
   * the first time your query loads. This makes initial loading states easy
   * and reduces flicker on subsequent fetch/refetches.
   */
  loaded: boolean;
  /**
   * Manually refetch the query. You can skip the cache, hit the server
   * and repopulate the cache by calling this like `refetch({ skipCache: true })`.
   */
  refetch: (options: { skipFetch?: boolean }, initial?: boolean) => void;
  /**
   * Manually refetch all queries from the cache.
   */
  refreshAllFromCache: () => void;
} & Mutations;

export const Connect = function<T>(props: ConnectProps<T>) {
  return (
    <ContextConsumer>
      {(client: Client) => (
        <UrqlClient
          client={client}
          children={props.children}
          query={props.query}
          mutation={props.mutation}
        />
      )}
    </ContextConsumer>
  );
};
