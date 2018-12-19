import createReactContext, {
  ConsumerProps,
  ProviderProps,
} from 'create-react-context';
// @ts-ignore
import { ComponentClass, Context } from 'react';

const Context = createReactContext({});

export const context = (Context as any) as Context<{}>;

export const ContextConsumer = Context.Consumer as ComponentClass<
  ConsumerProps<{}>
>;
export const ContextProvider = Context.Provider as ComponentClass<
  ProviderProps<{}>
>;
