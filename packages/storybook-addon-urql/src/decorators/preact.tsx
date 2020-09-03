import { h } from 'preact';
import { addDecorator } from '@storybook/preact';
import { Provider, createClient } from 'urql';
import { getStorybookExchange } from '../exchange';

addDecorator((Story, context) => {
  const client = createClient({
    url: 'storehhh',
    exchanges: [getStorybookExchange(context)],
  });

  return (
    <Provider value={client}>
      <Story {...context} />
    </Provider>
  );
});
