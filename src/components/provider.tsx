import React, { Component, ReactNode } from 'react';
import { IClient } from '../interfaces/index';
import { Provider as ContextProvider } from './context';

export interface IProviderProps {
  children: ReactNode;
  client: IClient;
}

export default class Provider extends Component<IProviderProps> {
  render() {
    // Use react-create-context to provide client over context
    return (
      <ContextProvider value={this.props.client}>
        {this.props.children}
      </ContextProvider>
    );
  }
}
