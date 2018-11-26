import React, { Component, ReactNode } from 'react';
import { Client } from '../lib';
import { ContextProvider } from './context';

export interface ProviderProps {
  children: ReactNode;
  client: Client;
}

export class Provider extends Component<ProviderProps> {
  render() {
    // Use react-create-context to provide client over context
    return (
      <ContextProvider value={this.props.client}>
        {this.props.children}
      </ContextProvider>
    );
  }
}
