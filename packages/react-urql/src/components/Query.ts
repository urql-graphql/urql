import type { ReactElement } from 'react';
import type { AnyVariables } from '@urql/core';

import type { UseQueryArgs, UseQueryState, UseQueryExecute } from '../hooks';
import { useQuery } from '../hooks';

/** Props accepted by {@link Query}.
 *
 * @remarks
 * `QueryProps` are the props accepted by the {@link Query} component,
 * which is identical to {@link UseQueryArgs}.
 *
 * The result, the {@link QueryState} object, will be passed to
 * a {@link QueryProps.children} function, passed as children
 * to the `Query` component.
 */
export type QueryProps<
  Data = any,
  Variables extends AnyVariables = AnyVariables
> = UseQueryArgs<Variables, Data> & {
  children(arg: QueryState<Data, Variables>): ReactElement<any>;
};

/** Object that {@link QueryProps.children} is called with.
 *
 * @remarks
 * This is an extented {@link UseQueryState} with an added
 * {@link QueryState.executeQuery} method, which is usually
 * part of a tuple returned by {@link useQuery}.
 */
export interface QueryState<
  Data = any,
  Variables extends AnyVariables = AnyVariables
> extends UseQueryState<Data, Variables> {
  /** Alias to {@link useQuery}’s `executeQuery` function. */
  executeQuery: UseQueryExecute;
}

/** Component Wrapper around {@link useQuery} to run a GraphQL query.
 *
 * @remarks
 * `Query` is a component wrapper around the {@link useQuery} hook
 * that calls the {@link QueryProps.children} prop, as a function,
 * with the {@link QueryState} object.
 */
export function Query<
  Data = any,
  Variables extends AnyVariables = AnyVariables
>(props: QueryProps<Data, Variables>): ReactElement<any> {
  const query = useQuery<Data, Variables>(props);
  return props.children({ ...query[0], executeQuery: query[1] });
}
