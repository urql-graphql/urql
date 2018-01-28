import React, { Component, ReactNode } from 'react';
import { IClient, IMutation, IQuery } from '../interfaces/index';
import ClientWrapper from './client';
import { Consumer } from './context';

export interface IConnectProps {
  render: (object) => ReactNode; // Render prop
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

export default class Connect extends Component<IConnectProps> {
  render() {
    // Use react-create-context to provide context to ClientWrapper
    return (
      <Consumer>
        {(client: IClient) => (
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
