import React, { ReactNode } from 'react';
import { Client } from '../types';
import { ContextProvider } from './context';

export interface ProviderProps {
  children: ReactNode;
  client: Client;
}

export const Provider: React.SFC<ProviderProps> = function(props) {
  return (
    <ContextProvider value={props.client}>{props.children}</ContextProvider>
  );
};
