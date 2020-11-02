/** FUTURE EXPORT - NOT CURRENTLY BEING USED */
import { addDecorator } from '@storybook/preact';
import { Provider, createClient } from '@urql/preact';
import { createElement } from 'preact';
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
    url: '/graphql',
    exchanges,
  });

  return createElement(Provider, { value: client, children: Story(context) });
};
