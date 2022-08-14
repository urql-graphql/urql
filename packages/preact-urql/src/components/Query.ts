import { VNode } from 'preact';
import { AnyVariables, OperationContext } from '@urql/core';
import { useQuery, UseQueryArgs, UseQueryState } from '../hooks';

export type QueryProps<
  Data = any,
  Variables extends AnyVariables = AnyVariables
> = UseQueryArgs<Variables, Data> & {
  children: (arg: QueryState<Data, Variables>) => VNode<any>;
};

export interface QueryState<
  Data = any,
  Variables extends AnyVariables = AnyVariables
> extends UseQueryState<Data, Variables> {
  executeQuery: (opts?: Partial<OperationContext>) => void;
}

export function Query<Data = any, Variables = any>(
  props: QueryProps<Data, Variables>
): VNode<any> {
  const query = useQuery<Data, Variables>(props);
  return props.children({ ...query[0], executeQuery: query[1] });
}
