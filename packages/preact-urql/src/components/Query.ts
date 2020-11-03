import { VNode } from 'preact';
import { OperationContext } from '@urql/core';
import { useQuery, UseQueryArgs, UseQueryState } from '../hooks';

export interface QueryProps<Data = any, Variables = object>
  extends UseQueryArgs<Variables, Data> {
  children: (arg: QueryState<Data, Variables>) => VNode<any>;
}

export interface QueryState<Data = any, Variables = object>
  extends UseQueryState<Data, Variables> {
  executeQuery: (opts?: Partial<OperationContext>) => void;
}

export function Query<Data = any, Variables = any>(
  props: QueryProps<Data, Variables>
): VNode<any> {
  const query = useQuery<Data, Variables>(props);
  return props.children({ ...query[0], executeQuery: query[1] });
}
