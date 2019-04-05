declare module 'create-react-context' {
  import * as React from 'react';

  export default function createReactContext<T>(
    defaultValue: T
  ): React.Context<T>;

  export type Context<T> = React.Context<T>;

  export interface ProviderProps<T> {
    value: T;
    children: React.ReactNode;
  }

  export interface ConsumerProps<T> {
    children: (value: T) => React.ReactNode;
  }
}

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
