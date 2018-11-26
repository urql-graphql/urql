import React, { Component, ReactNode } from 'react';
import { Cache, Mutation, Query } from '../interfaces/index';
import { UrqlClient } from './client';
import { ContextConsumer } from './context';
import { Client } from '../lib';

export interface IConnectProps<Data, Mutations> {
  children: (props: UrqlProps<Data, Mutations>) => ReactNode; // Render prop
  subscription?: Query;
  query?: Query | Query[]; // Query or queries
  mutation?: Mutation; // Mutation map
  updateSubscription?: (
    prev: object | null,
    next: object | null
  ) => object | null;
  cacheInvalidation?: boolean;
  cache?: boolean;
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

export class Connect<Data = {}, Mutations = {}> extends Component<
  IConnectProps<Data, Mutations>
> {
  render() {
    // Use react-create-context to provide context to UrqlClient
    return (
      <ContextConsumer>
        {(client: Client) => (
          <UrqlClient
            client={client}
            children={this.props.children}
            subscription={this.props.subscription}
            query={this.props.query}
            mutation={this.props.mutation}
            updateSubscription={this.props.updateSubscription}
            cacheInvalidation={this.props.cacheInvalidation}
            cache={this.props.cache}
          />
        )}
      </ContextConsumer>
    );
  }
}
