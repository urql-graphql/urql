import { createContext } from 'react';
import { Client, createClient } from './client';

// We assume some default options here; mainly not to actually be used
// but not to error catastrophically if someone is just playing around
const defaultClient = createClient({ url: '/graphql' });

export const Context = createContext<Client>(defaultClient);
export const Provider = Context.Provider;
export const Consumer = Context.Consumer;
