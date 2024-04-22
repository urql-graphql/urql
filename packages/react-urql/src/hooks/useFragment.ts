/* eslint-disable react-hooks/exhaustive-deps */

import * as React from 'react';

import type {
  GraphQLRequestParams,
  AnyVariables,
  Client,
  DocumentInput,
  OperationContext,
  RequestPolicy,
  OperationResult,
  Operation,
  GraphQLRequest,
} from '@urql/core';

import { useClient } from '../context';
import { useRequest } from './useRequest';
import { getCacheForClient } from './cache';

import {
  deferDispatch,
  initialState,
  computeNextState,
  hasDepsChanged,
} from './state';
import { FragmentDefinitionNode, Kind, SelectionSetNode } from 'graphql';

/** Input arguments for the {@link useQuery} hook.
 *
 * @param query - The GraphQL query that `useQuery` executes.
 */
export type UseQueryArgs<Data = any> = {
  context: Partial<OperationContext>;
  query: GraphQLRequestParams<Data, AnyVariables>['query'];
  data: Data;
  name?: string;
};

/** State of the current query, your {@link useQuery} hook is executing.
 *
 * @remarks
 * `UseQueryState` is returned (in a tuple) by {@link useQuery} and
 * gives you the updating {@link OperationResult} of GraphQL queries.
 *
 * Even when the query and variables passed to {@link useQuery} change,
 * this state preserves the prior state and sets the `fetching` flag to
 * `true`.
 * This allows you to display the previous state, while implementing
 * a separate loading indicator separately.
 */
export interface UseFragmentState<Data = any> {
  /** Indicates whether `useQuery` is waiting for a new result.
   *
   * @remarks
   * When `useQuery` is passed a new query and/or variables, it will
   * start executing the new query operation and `fetching` is set to
   * `true` until a result arrives.
   *
   * Hint: This is subtly different than whether the query is actually
   * fetching, and doesn’t indicate whether a query is being re-executed
   * in the background. For this, see {@link UseQueryState.stale}.
   */
  fetching: boolean;
  /** The {@link OperationResult.data} for the executed query. */
  data?: Data;
}

/** Result tuple returned by the {@link useQuery} hook.
 *
 * @remarks
 * Similarly to a `useState` hook’s return value,
 * the first element is the {@link useQuery}’s result and state,
 * a {@link UseQueryState} object,
 * and the second is used to imperatively re-execute the query
 * via a {@link UseQueryExecute} function.
 */
export type UseQueryResponse<Data = any> = UseFragmentState<Data>;

const isSuspense = (client: Client, context?: Partial<OperationContext>) =>
  context && context.suspense !== undefined
    ? !!context.suspense
    : client.suspense;

/** Hook to mask a GraphQL Fragment given its data.
 *
 * @param args - a {@link UseQueryArgs} object, to pass a `fragment` and `data`.
 * @returns a {@link UseQueryResponse} tuple of a {@link UseQueryState} result, and re-execute function.
 *
 * @remarks
 * `useQuery` allows GraphQL queries to be defined and executed.
 * Given {@link UseQueryArgs.query}, it executes the GraphQL query with the
 * context’s {@link Client}.
 *
 * The returned result updates when the `Client` has new results
 * for the query, and changes when your input `args` change.
 *
 * Additionally, if the `suspense` option is enabled on the `Client`,
 * the `useQuery` hook will suspend instead of indicating that it’s
 * waiting for a result via {@link UseQueryState.fetching}.
 *
 * @see {@link https://urql.dev/goto/urql/docs/basics/react-preact/#queries} for `useQuery` docs.
 *
 * @example
 * ```ts
 * import { gql, useQuery } from 'urql';
 *
 * const TodosQuery = gql`
 *   query { todos { id, title } }
 * `;
 *
 * const Todos = () => {
 *   const [result, reexecuteQuery] = useQuery({
 *     query: TodosQuery,
 *     variables: {},
 *   });
 *   // ...
 * };
 * ```
 */
export function useFragment<Data = any>(
  args: UseQueryArgs<Data>
): UseQueryResponse<Data> {
  const { query, data } = args;
  const client = useClient();
  const cache = getCacheForClient(client);
  const suspense = isSuspense(client, args.context);
  const request = useRequest(query, {});

  const getSnapshot = React.useCallback(
    (
      request: GraphQLRequest<Data, AnyVariables>,
      data: Data,
      suspense: boolean
    ): Partial<UseFragmentState<Data>> => {
      const cached = cache.get(request.key);
      if (!cached) {
        const fragment = request.query.definitions.find(
          x =>
            x.kind === 'FragmentDefinition' &&
            ((args.name && x.name.value === args.name) || !args.name)
        );
        const newResult = maskFragment(
          data,
          (fragment as FragmentDefinitionNode).selectionSet
        );
        if (newResult == null && suspense) {
          const promise = new Promise(() => {});
          cache.set(request.key, promise);
          throw promise;
        } else {
          return { fetching: true, data: newResult.data };
        }
      } else if (suspense && cached != null && 'then' in cached) {
        throw cached;
      }

      return (cached as OperationResult<Data>) || { fetching: true };
    },
    [cache, request]
  );

  const deps = [client, request, args.context, data] as const;

  const [state, setState] = React.useState(
    () =>
      [
        computeNextState(initialState, getSnapshot(request, data, suspense)),
        deps,
      ] as const
  );

  let currentResult = state[0];
  if (hasDepsChanged(state[1], deps)) {
    setState([
      (currentResult = computeNextState(
        state[0],
        getSnapshot(request, data, suspense)
      )),
      deps,
    ]);
  }

  return currentResult;
}

const maskFragment = (
  data: Record<string, any>,
  selectionSet: SelectionSetNode
): { data: Record<string, any>; fulfilled: boolean } => {
  const maskedData = {};
  let isDataComplete = true;
  selectionSet.selections.forEach(selection => {
    if (selection.kind === Kind.FIELD) {
      const fieldAlias = selection.alias
        ? selection.alias.value
        : selection.name.value;
      if (selection.selectionSet) {
        if (data[fieldAlias] === undefined) {
          isDataComplete = false;
        } else if (data[fieldAlias] === null) {
          maskedData[fieldAlias] = null;
        } else if (Array.isArray(data[fieldAlias])) {
          maskedData[fieldAlias] = data[fieldAlias].map(item => {
            const result = maskFragment(
              item,
              selection.selectionSet as SelectionSetNode
            );
            if (!result.fulfilled) {
              isDataComplete = false;
            }
            return result.data;
          });
        } else {
          const result = maskFragment(data[fieldAlias], selection.selectionSet);
          if (!result.fulfilled) {
            isDataComplete = false;
          }
          maskedData[fieldAlias] = result.data;
        }
      } else {
        if (data[fieldAlias] === undefined) {
          isDataComplete = false;
        } else if (data[fieldAlias] === null) {
          maskedData[fieldAlias] = null;
        } else if (Array.isArray(data[fieldAlias])) {
          maskedData[fieldAlias] = data[fieldAlias].map(item => item);
        } else {
          maskedData[fieldAlias] = data[fieldAlias];
        }
      }
      maskedData[selection.name.value] = data[selection.name.value];
    }
  });

  return { data: maskedData, fulfilled: isDataComplete };
};
