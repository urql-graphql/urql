import React, { ComponentType } from 'react';
import { Connect, ConnectProps } from '../components/connect';
import { ChildArgs } from '../types';

/** Props for the [ConnectHOC]{@link ConnectHOC} component. */
export interface ConnectHOCProps<T> {
  /** The GraphQL query to fetch. */
  query?: ConnectProps<T>['query'];
  /** A collection of GrahpQL mutation queries. */
  mutations?: ConnectProps<T>['mutations'];
}

/** A HOC alternative implementation to the [Connect]{@link Connect} component. */
export const ConnectHOC = function<T>(opts?: ConnectHOCProps<T>) {
  return (Comp: ComponentType<ChildArgs<T>>) => {
    const children = (args: ChildArgs<T>) => <Comp {...args} />;
    children.displayName = Comp.displayName || Comp.name || 'Component';

    const connected = () => <Connect {...opts} children={children} />;
    connected.displayName = `Connect(${children.displayName})`;

    return connected;
  };
};
