import { VNode } from 'preact';
import { OperationContext } from '@urql/core';
import { useQuery, UseQueryArgs, UseQueryState } from '../hooks';

export interface QueryProps<T, V> extends UseQueryArgs<V> {
  children: (arg: QueryState<T>) => VNode<any>;
}

export interface QueryState<T> extends UseQueryState<T> {
  executeQuery: (opts?: Partial<OperationContext>) => void;
}

export function Query<T = any, V = any>(props: QueryProps<T, V>): VNode<any> {
  const queryState = useQuery<T, V>(props);
  return props.children({ ...queryState[0], executeQuery: queryState[1] });
}
