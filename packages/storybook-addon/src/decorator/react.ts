import { addDecorator } from '@storybook/react';
import { createClient } from '@urql/core';
import { createElement } from 'react';
import { Provider } from 'urql';
import { getStorybookExchange } from '../exchange';

export const urqlDecorator: Parameters<typeof addDecorator>[0] = (
  Story,
  context
) => {
  const client = createClient({
    url: 'storehhh',
    exchanges: [getStorybookExchange(context)],
  });

  return createElement(Provider, { value: client, children: Story(context) });
};
