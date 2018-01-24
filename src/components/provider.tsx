import React, { Component, ReactNode } from 'react';
import { Provider as ContextProvider } from './context';
import { Client } from '../interfaces/index';

export interface ProviderProps {
  children: ReactNode;
  client: Client;
}

export default class Provider extends Component<ProviderProps> {
  render() {
    // Use react-create-context to provide client over context
    return (
      <ContextProvider value={this.props.client}>
        {this.props.children}
      </ContextProvider>
    );
  }
}
