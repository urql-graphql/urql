import createReactContext from 'create-react-context';
import { Client } from '../types';

const context = createReactContext<Client>({} as any); // Requires default value (which is unused)

export const ContextProvider = context.Provider;
export const ContextConsumer = context.Consumer;
