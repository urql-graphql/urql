import { addDecorator } from '@storybook/preact';
import { Provider, createClient } from '@urql/preact';
import { createElement } from 'preact';
import { getStorybookExchange } from '../exchange';

export const urqlDecorator: Parameters<typeof addDecorator>[0] = (
  Story,
  context
) => {
  const client = createClient({
    url: '/graphql',
    exchanges: [getStorybookExchange(context)],
  });

  return createElement(Provider, { value: client, children: Story(context) });
};
