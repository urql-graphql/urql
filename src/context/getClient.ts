import { getContext } from 'svelte';
import { Client } from 'urql/core';
import { CLIENT } from '../constants';

export const getClient = (): Client => getContext(CLIENT);
