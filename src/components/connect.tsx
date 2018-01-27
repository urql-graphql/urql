import React, { Component, ReactNode } from 'react';
import { Consumer } from './context';
import ClientWrapper from './client';
import { Client, Query, Mutation } from '../interfaces/index';

export interface ConnectProps {
  render: (object) => ReactNode; // Render prop
  query?: Query | Array<Query>; // Query or queries
  mutation?: Mutation; // Mutation map
  cache?: boolean;
  typeInvalidation?: boolean;
  shouldInvalidate?: (
    changedTypes: Array<string>,
    typeNames: Array<string>,
    response: object,
    data: object
  ) => boolean;
}

export default class Connect extends Component<ConnectProps> {
  render() {
    // Use react-create-context to provide context to ClientWrapper
    return (
      <Consumer>
        {(client: Client) => (
          <ClientWrapper
            client={client}
            render={this.props.render}
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
