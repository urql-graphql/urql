import createContext from 'create-react-context';
import { Client } from '../lib/client';

// We assume some default options here; mainly not to actually be used
// but not to error catastrophically if someone is just playing around
const defaultOptions = { url: '/graphql' };
const context = createContext<Client>(new Client(defaultOptions));

export const ContextProvider = context.Provider;
export const ContextConsumer = context.Consumer;
