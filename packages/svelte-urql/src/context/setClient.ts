import { setContext } from 'svelte';
import { Client } from '@urql/core';
import { CLIENT } from './constants';

export const setClient = (client: Client): void => {
  setContext(CLIENT, client);
};
