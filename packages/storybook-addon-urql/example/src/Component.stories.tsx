import React from 'react';
import { Component } from './Component';

export default {
  title: 'Story',
};

export const Sync = () => <Component />;
Sync.parameters = {
  urql: () => ({ data: { user: { id: 1234, name: 'Steve' } } }),
};

export const Async = () => <Component />;
Async.parameters = {
  urql: async () => ({ data: { user: { id: 1234, name: 'Steve' } } }),
};

export const Fetching = () => <Component />;
Fetching.parameters = {
  urql: () => new Promise(() => {}),
};

export const Errored = () => <Component />;
Errored.parameters = {
  urql: () => ({ errors: ['Oh no'] }),
};
