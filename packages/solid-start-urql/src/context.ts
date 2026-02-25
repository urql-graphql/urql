import type { Client } from '@urql/core';
import { createContext, useContext } from 'solid-js';
import type {
  query as defaultQuery,
  action as defaultAction,
} from '@solidjs/router';

export interface UrqlContext {
  client: Client;
  query: typeof defaultQuery;
  action: typeof defaultAction;
}

export const Context = createContext<UrqlContext>();
export const Provider = Context.Provider;

const hasContext = (
  context: UrqlContext | undefined,
  type: 'client' | 'context' | 'action'
) => {
  if (process.env.NODE_ENV !== 'production' && context === undefined) {
    const error = `No ${type} has been specified using urql's Provider. Please create a context and add a Provider.`;

    console.error(error);
    throw new Error(error);
  }
};

export type UseClient = () => Client;
export const useClient: UseClient = () => {
  const context = useContext(Context);
  hasContext(context, 'client');
  return context!.client;
};

export type UseQuery = () => typeof defaultQuery;
export const useQuery: UseQuery = () => {
  const context = useContext(Context);
  hasContext(context, 'context');
  return context!.query;
};

export type UseAction = () => typeof defaultAction;
export const useAction: UseAction = () => {
  const context = useContext(Context);
  hasContext(context, 'action');
  return context!.action;
};
