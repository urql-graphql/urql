import { addDecorator } from '@storybook/react';
import { urqlDecorator } from 'storybook-addon-urql';

console.log(urqlDecorator);

addDecorator(urqlDecorator);
