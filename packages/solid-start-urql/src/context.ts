import type { Client } from '@urql/core';
import { createContext, useContext } from 'solid-js';
import { query as defaultQuery } from '@solidjs/router';

export interface UrqlContext {
  client: Client;
  query: typeof defaultQuery;
}

export const Context = createContext<UrqlContext>();
export const Provider = Context.Provider;

const hasContext = () => {
  if (process.env.NODE_ENV !== 'production' && context === undefined) {
    const error =
      "No context has been specified using urql's Provider. Please create a context and add a Provider.";

    console.error(error);
    throw new Error(error);
  }
};

export type UseClient = () => Client;
export const useClient: UseClient = () => {
  const context = useContext(Context);
  hasContext();
  return context!.client;
};

export type UseQuery = () => typeof defaultQuery;
export const useQuery: UseQuery = () => {
  const context = useContext(Context);
  hasContext();
  return context!.query;
};
