import React, { ReactNode } from 'react';
import { ChildArgs, Client, Mutation, Query, Subscription } from '../types';
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
  subscriptions?: Subscription[];
  /** An updator function for merging subscription responses */
  updateSubscription?: (
    type: string,
    prev: object | null,
    next: object | null
  ) => object | null;
}

/** Component for connecting to the urql client for executing queries, mutations and returning the result to child components. */
export const Connect = function<T>(props: ConnectProps<T>) {
  return (
    <Consumer>
      {client => (
        <UrqlClient
          client={client}
          children={props.children}
          query={props.query}
          mutations={props.mutations}
          subscriptions={props.subscriptions}
          updateSubscription={props.updateSubscription}
        />
      )}
    </Consumer>
  );
};
