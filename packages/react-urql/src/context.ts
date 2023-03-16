import { createContext, useContext } from 'react';
import { Client } from '@urql/core';

const OBJ = {};
export const Context: import('react').Context<Client | object> = createContext(
  OBJ
);
export const Provider: import('react').Provider<Client | object> =
  Context.Provider;
export const Consumer: import('react').Consumer<Client | object> =
  Context.Consumer;

Context.displayName = 'UrqlContext';

export const useClient = (): Client => {
  const client = useContext(Context);

  if (client === OBJ && process.env.NODE_ENV !== 'production') {
    const error =
      "No client has been specified using urql's Provider. please create a client and add a Provider.";

    console.error(error);
    throw new Error(error);
  }

  return client as Client;
};
