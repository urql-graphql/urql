import React, { Component, ReactNode } from 'react';
import { ICache, IClient, IMutation, IQuery } from '../interfaces/index';
import ClientWrapper from './client';
import { Consumer } from './context';

export interface IConnectProps<Data, Mutations> {
  children: (props: UrqlProps<Data, Mutations>) => ReactNode; // Render prop
  subscription?: IQuery;
  query?: IQuery | IQuery[]; // Query or queries
  mutation?: IMutation; // Mutation map
  updateSubscription?: (
    prev: object | null,
    next: object | null
  ) => object | null;
  cache?: boolean;
  typeInvalidation?: boolean;
  shouldInvalidate?: (
    changedTypes: string[],
    typeNames: string[],
    response: object,
    data: object
  ) => boolean;
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
  cache: ICache;
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

export default class Connect<Data = {}, Mutations = {}> extends Component<
  IConnectProps<Data, Mutations>
> {
  render() {
    // Use react-create-context to provide context to ClientWrapper
    return (
      <Consumer>
        {(client: IClient) => (
          <ClientWrapper
            client={client}
            children={this.props.children}
            subscription={this.props.subscription}
            query={this.props.query}
            mutation={this.props.mutation}
            updateSubscription={this.props.updateSubscription}
            cache={this.props.cache}
            typeInvalidation={this.props.typeInvalidation}
            shouldInvalidate={this.props.shouldInvalidate}
          />
        )}
      </Consumer>
    );
  }
}
