import React, { ReactNode } from 'react';
import { Client } from '../types';
import { ContextProvider } from './context';

/** Props for the [Provider]{@link Provider} component. */
export interface ProviderProps {
  /** Child components to be rendered. */
  children: ReactNode;
  /** Urql client returned from createClient. */
  client: Client;
}

/** Component to configure the [urql client]{@link Client} for use throughout the application. */
export const Provider: React.SFC<ProviderProps> = function(props) {
  return (
    <ContextProvider value={props.client}>{props.children}</ContextProvider>
  );
};
