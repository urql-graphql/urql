import React, { Component, ReactNode } from 'react';
import { ICache, IClient, IMutation, IQuery } from '../interfaces/index';
import ClientWrapper from './client';
import { Consumer } from './context';

export interface IConnectProps<Data = {}, Mutations = {}> {
  children: (obj: UrqlProps<Data, Mutations>) => ReactNode; // Render prop
  query?: IQuery | IQuery[]; // Query or queries
  mutation?: IMutation; // Mutation map
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
export type UrqlProps<Data, Mutations = {}> = {
  cache: ICache;
  loaded: boolean;
  fetching: boolean;
  refetch: (options: { skipFetch?: boolean }, initial?: boolean) => void;
  refreshAllFromCache: () => void;
  data: Data | null;
  error: any;
} & Mutations;

export default class Connect extends Component<IConnectProps> {
  render() {
    // Use react-create-context to provide context to ClientWrapper
    return (
      <Consumer>
        {(client: IClient) => (
          <ClientWrapper
            client={client}
            children={this.props.children}
            query={this.props.query}
            mutation={this.props.mutation}
            cache={this.props.cache}
            typeInvalidation={this.props.typeInvalidation}
            shouldInvalidate={this.props.shouldInvalidate}
          />
        )}
      </Consumer>
    );
  }
}
