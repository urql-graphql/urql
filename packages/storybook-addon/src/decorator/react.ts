import '../storybook';
import { addDecorator } from '@storybook/react';
import { createElement } from 'react';
import { Provider, createClient } from 'urql';
import { getStorybookExchange } from '../exchange';

/* eslint-disable */
const { devtoolsExchange } = require('@urql/devtools');

export const urqlDecorator: Parameters<typeof addDecorator>[0] = (
  Story,
  context
) => {
  const exchanges = [getStorybookExchange(context)];

  if (devtoolsExchange) {
    exchanges.unshift(devtoolsExchange);
  }

  const client = createClient({
    url: 'storehhh',
    exchanges,
  });

  return createElement(Provider, { value: client, children: Story(context) });
};
