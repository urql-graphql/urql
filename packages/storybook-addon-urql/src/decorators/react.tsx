import React from 'react';
import { addDecorator } from '@storybook/react';
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
