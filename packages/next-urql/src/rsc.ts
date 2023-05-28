import * as React from 'react';
import { Client } from '@urql/core';

export function registerUrql(makeClient: () => Client) {
  // @ts-ignore you exist don't worry
  const getClient = React.cache(makeClient);
  return {
    getClient,
  };
}
