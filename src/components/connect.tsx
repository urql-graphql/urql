import React, { ReactNode } from 'react';
import { ChildArgs, Mutation, Query, Subscription } from '../types';
import { UrqlClient } from './client';
import { Consumer } from './context';

/** Props for the [Connect]{@link Connect} component. */
export interface ConnectProps<T> {
  /** A function which receives values from the URQL client. */
  children: (props: ChildArgs<T>) => ReactNode;
  /** The GraphQL query to fetch */
  query?: Query;
  /** A collection of GrahpQL mutation queries */
  mutations?: { [type in keyof T]: Mutation };
  /** An array of GrahpQL subscription queries */
  subscription?: Subscription;
  /** An updator function for merging subscription responses */
  updateSubscription?: <Data, Update>(prev: Data, next: Update) => Data;
}

/** Component for connecting to the urql client for executing queries, mutations and returning the result to child components. */
export function Connect<T>(props: ConnectProps<T>) {
  return (
    <Consumer>{client => <UrqlClient {...props} client={client} />}</Consumer>
  );
}
