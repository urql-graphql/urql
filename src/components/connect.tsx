import React, { ReactNode } from 'react';
import { ChildArgs, Client, Mutation, Query } from '../types';
import { UrqlClient } from './client';
import { ContextConsumer } from './context';

/** Props for the [Connect]{@link Connect} component. */
export interface ConnectProps<T> {
  /** A function which receives values from the URQL client. */
  children: (props: ChildArgs<T>) => ReactNode;
  /** The GraphQL query to fetch */
  query?: Query;
  /** A collection of GrahpQL mutation queries */
  mutations?: { [type in keyof T]: Mutation };
}

/** Component for connecting to the urql client for executing queries, mutations and returning the result to child components. */
export const Connect = function<T>(props: ConnectProps<T>) {
  return (
    <ContextConsumer>
      {(client: Client) => (
        <UrqlClient
          client={client}
          children={props.children}
          query={props.query}
          mutations={props.mutations}
        />
      )}
    </ContextConsumer>
  );
};
