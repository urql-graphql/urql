import { createContext, useContext } from 'react';
import { Client, createClient } from '@urql/core';

// We assume some default options here; mainly not to actually be used
// but not to error catastrophically if someone is just playing around
const defaultClient = createClient({ url: '/graphql' });

export const Context: import('react').Context<Client> = createContext(
  defaultClient
);
export const Provider: import('react').Provider<Client> = Context.Provider;
export const Consumer: import('react').Consumer<Client> = Context.Consumer;

Context.displayName = 'UrqlContext';

let hasWarnedAboutDefault = false;

export const useClient = (): Client => {
  const client = useContext(Context);

  if (
    process.env.NODE_ENV !== 'production' &&
    client === defaultClient &&
    !hasWarnedAboutDefault
  ) {
    hasWarnedAboutDefault = true;

    console.warn(
      "Default Client: No client has been specified using urql's Provider." +
        'This means that urql will be falling back to defaults including making ' +
        'requests to `/graphql`.\n' +
        "If that's not what you want, please create a client and add a Provider."
    );
  }

  return client;
};
