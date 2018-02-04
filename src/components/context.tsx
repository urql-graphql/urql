import createReactContext, {
  ProviderProps,
  ConsumerProps,
} from 'create-react-context';
import { ComponentClass } from 'react';

const context = createReactContext({});

// TypeScript is very pedantic about re-exporting dependencies when doing
// --declaration emit, so we need to import ComponentClass. But if we don't
// explicitly use ComponentClass somewhere in the code, TypeScript *also*
// ends up issuing an error. This is dumb, but this all gets erased anyway.
interface Context {
  Provider: ComponentClass<ProviderProps<{}>>;
  Consumer: ComponentClass<ConsumerProps<{}>>;
}

export const { Provider, Consumer }: Context = context;
