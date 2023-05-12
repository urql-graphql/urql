import React from 'react';
import { Client } from '@urql/core';

export function registerUrql(makeClient: () => Client) {
  const getClient = React.cache(makeClient);
  return {
    getClient,
  };
}
