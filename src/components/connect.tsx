import React, { ReactNode } from 'react';
import { ChildArgs, Client, Cache, Query, Mutation } from '../types';
import { UrqlClient } from './client';
import { ContextConsumer } from './context';

export interface ConnectProps<T> {
  /** A function which receives values from the URQL client. */
  children: (props: ChildArgs<T>) => ReactNode;
  /** The GraphQL query to fetch */
  query?: Query;
  /** A collection of GrahpQL mutation queries */
  mutation?: { [type in keyof T]: Mutation };
}

export const Connect = function<T>(props: ConnectProps<T>) {
  return (
    <ContextConsumer>
      {(client: Client) => (
        <UrqlClient
          client={client}
          children={props.children}
          query={props.query}
          mutation={props.mutation}
        />
      )}
    </ContextConsumer>
  );
};
