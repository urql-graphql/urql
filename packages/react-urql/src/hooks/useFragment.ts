/* eslint-disable react-hooks/exhaustive-deps */

import * as React from 'react';
import type {
  FragmentDefinitionNode,
  SelectionSetNode,
} from '@0no-co/graphql.web';
import { Kind } from '@0no-co/graphql.web';

import type {
  GraphQLRequestParams,
  AnyVariables,
  Client,
  OperationContext,
  OperationResult,
  GraphQLRequest,
} from '@urql/core';

import { useClient } from '../context';
import { useRequest } from './useRequest';
import { getCacheForClient } from './cache';

import { initialState, computeNextState, hasDepsChanged } from './state';

/** Input arguments for the {@link useFragment} hook. */
export type UseFragmentArgs<Data = any> = {
  /** Updates the {@link OperationContext} for the executed GraphQL query operation.
   *
   * @remarks
   * `context` may be passed to {@link useFragment}, to update the {@link OperationContext}
   * of a query operation. This may be used to update the `context` that exchanges
   * will receive for a single hook.
   *
   * Hint: This should be wrapped in a `useMemo` hook, to make sure that your
   * component doesn’t infinitely update.
   *
   * @example
   * ```ts
   * const result = useFragment({
   *   query,
   *   data,
   *   context: useMemo(() => ({
   *     suspense: true,
   *   }), [])
   * });
   * ```
   */
  context: Partial<OperationContext>;
  /** A GraphQL document to mask this fragment against.
   *
   * @remarks
   * This Document should contain atleast one FragmentDefinitionNode or
   * a FragmentDefinitionNode with the same name as the `name` property.
   */
  query: GraphQLRequestParams<Data, AnyVariables>['query'];
  /** A JSON object which we will extract properties from to get to the
   * masked fragment.
   */
  data: Data;
  /** An optional name of the fragment to use. */
  name?: string;
};

/** State of the current query, your {@link useFragment} hook is executing.
 *
 * @remarks
 * `UseFragmentState` is returned by {@link useFragment} and
 * gives you the masked data for the fragment.
 */
export interface UseFragmentState<Data = any> {
  /** Indicates whether `useFragment` is waiting for a new result.
   *
   * @remarks
   * When `useFragment` is passed a new query and/or variables, it will
   * start executing the new query operation and `fetching` is set to
   * `true` until a result arrives.
   */
  fetching: boolean;
  /** The {@link OperationResult.data} for the masked fragment. */
  data?: Data;
}

const isSuspense = (client: Client, context?: Partial<OperationContext>) =>
  context && context.suspense !== undefined
    ? !!context.suspense
    : client.suspense;

/** Hook to mask a GraphQL Fragment given its data. (BETA)
 *
 * @param args - a {@link UseFragmentArgs} object, to pass a `fragment` and `data`.
 * @returns a {@link UseFragmentState} result.
 *
 * @remarks
 * `useFragments` allows GraphQL fragments to mask their data.
 * Given {@link UseFragmentArgs.query} and {@link UseFragmentArgs.data}, it will
 * return the masked data for the fragment contained in query.
 *
 * Additionally, if the `suspense` option is enabled on the `Client`,
 * the `useFragment` hook will suspend instead of indicating that it’s
 * waiting for a result via {@link UseFragmentState.fetching}.
 *
 * @example
 * ```ts
 * import { gql, useFragment } from 'urql';
 *
 * const TodoFields = gql`
 *   fragment TodoFields on Todo { id name }
 * `;
 *
 * const Todo = (props) => {
 *   const result = useQuery({
 *     data: props.todo,
 *     query: TodoFields,
 *     variables: {},
 *   });
 *   // ...
 * };
 * ```
 */
export function useFragment<
  Data extends Record<string, any> = Record<string, any>,
>(args: UseFragmentArgs<Data>): UseFragmentState<Data> {
  const client = useClient();
  const cache = getCacheForClient(client);
  const suspense = isSuspense(client, args.context);
  const request = useRequest(args.query, args.data);

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
            x.kind === Kind.FRAGMENT_DEFINITION &&
            ((args.name && x.name.value === args.name) || !args.name)
        ) as FragmentDefinitionNode | undefined;

        if (!fragment) {
          throw new Error(
            'Passed document did not contain a fragment definition' + args.name
              ? ` for ${args.name}`
              : ''
          );
        }

        const newResult = maskFragment<Data>(data, fragment.selectionSet);
        if (newResult.fulfilled) {
          cache.set(request.key, newResult.data as any);
          return { data: newResult.data as any, fetching: false };
        } else if (suspense) {
          const promise = new Promise(() => {});
          cache.set(request.key, promise);
          throw promise;
        } else {
          return { fetching: true, data: newResult.data };
        }
      } else if (suspense && cached != null && 'then' in cached) {
        throw cached;
      }

      return { fetching: false, data: (cached as OperationResult).data };
    },
    [cache, request]
  );

  const deps = [client, request, args.context, args.data] as const;

  const [state, setState] = React.useState(
    () =>
      [
        computeNextState(
          initialState,
          getSnapshot(request, args.data, suspense)
        ),
        deps,
      ] as const
  );

  let currentResult = state[0];
  if (hasDepsChanged(state[1], deps)) {
    setState([
      (currentResult = computeNextState(
        state[0],
        getSnapshot(request, args.data, suspense)
      )),
      deps,
    ]);
  }

  return currentResult;
}

const maskFragment = <Data extends Record<string, any>>(
  data: Data,
  selectionSet: SelectionSetNode
): { data: Data; fulfilled: boolean } => {
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
    } else if (selection.kind === Kind.INLINE_FRAGMENT) {
      if (
        selection.typeCondition &&
        selection.typeCondition.name.value !== data.__typename
      ) {
        return;
      }

      const result = maskFragment(data, selection.selectionSet);
      if (!result.fulfilled) {
        isDataComplete = false;
      }
      Object.assign(maskedData, result.data);
    } else if (selection.kind === Kind.FRAGMENT_SPREAD) {
      // TODO: do we want to support this?
    }
  });

  return { data: maskedData as Data, fulfilled: isDataComplete };
};
