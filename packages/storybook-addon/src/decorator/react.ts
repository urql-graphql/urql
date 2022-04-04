import '../storybook';
import { addDecorator } from '@storybook/react';
import { createElement } from 'react';
import { Provider, createClient, ClientOptions } from 'urql';
import { devtoolsExchange } from '@urql/devtools';
import { getStorybookExchange } from '../exchange';

const createDecorator = (
  opts?: Partial<ClientOptions>
): Parameters<typeof addDecorator>[0] => (Story, context) => {
  const client = createClient({
    ...opts,
    url: 'storehhh',
    exchanges: [devtoolsExchange, getStorybookExchange(context)],
  });

  return createElement(Provider, { value: client }, Story(context));
};

export const urqlDecorator = createDecorator();

export const urqlDecoratorSuspense = createDecorator({ suspense: true });
