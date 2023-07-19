import { Client } from '@urql/core';
import { createContext, useContext } from 'solid-js';

export const Context = createContext<Client>();
export const Provider = Context.Provider;

type UseClient = () => Client;
export const useClient: UseClient = () => {
  const client = useContext(Context);

  if (process.env.NODE_ENV !== 'production' && client === undefined) {
    const error =
      "No client has been specified using urql's Provider. please create a client and add a Provider.";

    console.error(error);
    throw new Error(error);
  }

  return client!;
};
