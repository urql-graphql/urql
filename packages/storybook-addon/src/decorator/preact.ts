/** FUTURE EXPORT - NOT CURRENTLY BEING USED */
import { addDecorator } from '@storybook/preact';
import { Provider, createClient, ClientOptions } from '@urql/preact';
import { devtoolsExchange } from '@urql/devtools';
import { createElement } from 'preact';
import { getStorybookExchange } from '../exchange';

const createDecorator = (
  opts?: Partial<ClientOptions>
): Parameters<typeof addDecorator>[0] => (Story, context) => {
  const client = createClient({
    ...opts,
    url: 'storehhh',
    exchanges: [devtoolsExchange, getStorybookExchange(context)],
  });

  return createElement(Provider, { value: client, children: Story(context) });
};

export const urqlDecorator = createDecorator();

export const urqlDecoratorSuspense = createDecorator({ suspense: true });
