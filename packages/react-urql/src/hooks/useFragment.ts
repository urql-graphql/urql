/* eslint-disable react-hooks/exhaustive-deps */

import * as React from 'react';
import type {
  FragmentDefinitionNode,
  InlineFragmentNode,
  SelectionSetNode,
} from '@0no-co/graphql.web';
import { Kind } from '@0no-co/graphql.web';

import type {
  GraphQLRequestParams,
  AnyVariables,
  Client,
  OperationContext,
  GraphQLRequest,
} from '@urql/core';

import { useClient } from '../context';
import { useRequest } from './useRequest';
import type { FragmentPromise } from './cache';
import { getFragmentCacheForClient } from './cache';

import { hasDepsChanged } from './state';
import { pipe, subscribe } from 'wonka';

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
  context?: Partial<OperationContext>;
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
  data: Data | null;
  /** An optional name of the fragment to use from the passed Document. */
  name?: string;
};

/** State of the current query, your {@link useFragment} hook is executing.
 *
 * @remarks
 * `UseFragmentState` is returned by {@link useFragment} and
 * gives you the masked data for the fragment.
 */
export interface UseFragmentState<Data> {
  /** Indicates whether `useFragment` is waiting for a new result.
   *
   * @remarks
   * When `useFragment` is passed a new query and/or variables, it will
   * start executing the new query operation and `fetching` is set to
   * `true` until a result arrives.
   */
  fetching: boolean;
  /** The data for the masked fragment. */
  data?: Data | null;
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
 *   const result = useFragment({
 *     data: props.todo,
 *     query: TodoFields,
 *   });
 *   // ...
 * };
 * ```
 */
export function useFragment<Data>(
  args: UseFragmentArgs<Data>
): UseFragmentState<Data> {
  const client = useClient();
  const cache = getFragmentCacheForClient(client);
  const suspense = isSuspense(client, args.context);

  const request = useRequest(args.query, {});

  const fragment = React.useMemo(() => {
    return request.query.definitions.find(
      x =>
        x.kind === Kind.FRAGMENT_DEFINITION &&
        ((args.name && x.name.value === args.name) || !args.name)
    ) as FragmentDefinitionNode | undefined;
  }, [args.query, args.name]);

  if (!fragment) {
    throw new Error(
      'Passed document did not contain a fragment definition' + args.name
        ? ` for ${args.name}.`
        : '.'
    );
  }

  const fragments = React.useMemo(() => {
    return request.query.definitions.reduce<
      Record<string, FragmentDefinitionNode>
    >((acc, frag) => {
      if (frag.kind === Kind.FRAGMENT_DEFINITION) {
        acc[frag.name.value] = frag;
      }
      return acc;
    }, {});
  }, [request.query]);

  const getSnapshot = React.useCallback(
    (
      request: GraphQLRequest<Data, AnyVariables>,
      data: Data | null,
      suspense: boolean
    ): UseFragmentState<Data> => {
      if (data === null) {
        return { data: null, fetching: false };
      } else if (!suspense) {
        const newResult = maskFragment<Data>(
          data,
          fragment.selectionSet,
          fragments
        );

        return { data: newResult.data, fetching: !newResult.fulfilled };
      }

      const cached = cache.get(request.key);
      if (!cached) {
        const newResult = maskFragment<Data>(
          data,
          fragment.selectionSet,
          fragments
        );

        if (newResult.fulfilled) {
          return { data: newResult.data, fetching: false };
        } else {
          let _resolve;
          const promise = new Promise(r => {
            _resolve = r;
          }) as FragmentPromise;
          pipe(
            client.operations$,
            subscribe(operation => {
              // Look for the marker
              const operations = newResult.markers.map(x => x.key);
              if (
                operation.kind === 'query' &&
                operations.includes(operation.key)
              ) {
                // Add the new data to the cache merged with props.data
                // if everything is fulfilled resolve the promise
              }
            })
          );
          promise._resolve = _resolve;
          cache.set(request.key, promise);
          throw promise;
        }
      } else {
        const newResult = maskFragment<Data>(
          data,
          fragment.selectionSet,
          fragments
        );

        if (!newResult.fulfilled) {
          throw cached;
        } else {
          cached._resolve();
          cache.dispose(request.key);
          return { data: newResult.data, fetching: false };
        }
      }
    },
    [cache, request]
  );

  const deps = [client, request, args.data, args.context] as const;

  const [state, setState] = React.useState(
    () => [getSnapshot(request, args.data, suspense), deps] as const
  );

  const currentResult = state[0];
  if (hasDepsChanged(state[1], deps)) {
    setState([getSnapshot(request, args.data, suspense), deps]);
  }

  return currentResult;
}

const MARKER = Symbol('urql-fragment-marker');
const isMarker = (data: any): boolean => {
  return !!data[MARKER];
};

const maskFragment = <Data>(
  data: Data,
  selectionSet: SelectionSetNode,
  fragments: Record<string, FragmentDefinitionNode>
): {
  data: Data;
  fulfilled: boolean;
  markers: Array<{ path: string[]; key: number }>;
} => {
  const maskedData = {};
  const markers: Array<{ path: string[]; key: number }> = [];
  let isDataComplete = true;
  selectionSet.selections.forEach(selection => {
    const hasIncludeOrSkip =
      selection.directives &&
      selection.directives.some(
        x => x.name.value === 'include' || x.name.value === 'skip'
      );

    if (selection.kind === Kind.FIELD) {
      const fieldAlias = selection.alias
        ? selection.alias.value
        : selection.name.value;

      if (isMarker(data[fieldAlias])) {
        markers.push(data[fieldAlias]);
      } else if (data[fieldAlias] === undefined) {
        if (hasIncludeOrSkip) return;
        isDataComplete = false;
      } else if (data[fieldAlias] === null) {
        maskedData[fieldAlias] = null;
      } else if (Array.isArray(data[fieldAlias])) {
        if (selection.selectionSet) {
          maskedData[fieldAlias] = data[fieldAlias].map(item => {
            const result = maskFragment(
              item,
              selection.selectionSet as SelectionSetNode,
              fragments
            );

            if (!result.fulfilled) {
              isDataComplete = false;
            }

            return result.data;
          });
        } else {
          maskedData[fieldAlias] = data[fieldAlias].map(item => item);
        }
      } else {
        if (selection.selectionSet) {
          const result = maskFragment(
            data[fieldAlias],
            selection.selectionSet,
            fragments
          );

          if (!result.fulfilled) {
            isDataComplete = false;
          }

          maskedData[fieldAlias] = result.data;
        } else {
          maskedData[fieldAlias] = data[fieldAlias];
        }
      }
    } else if (selection.kind === Kind.INLINE_FRAGMENT) {
      if (!isHeuristicFragmentMatch(selection, data, fragments)) {
        return;
      }

      const result = maskFragment(data, selection.selectionSet, fragments);
      if (!result.fulfilled && !hasIncludeOrSkip) {
        isDataComplete = false;
      }

      Object.assign(maskedData, result.data);
    } else if (selection.kind === Kind.FRAGMENT_SPREAD) {
      const fragment = fragments[selection.name.value];

      const hasDefer =
        selection.directives &&
        selection.directives.some(x => x.name.value === 'defer');

      if (!fragment || !isHeuristicFragmentMatch(fragment, data, fragments)) {
        return;
      }

      const result = maskFragment(data, fragment.selectionSet, fragments);
      if (!result.fulfilled && !hasIncludeOrSkip && !hasDefer) {
        isDataComplete = false;
      }
      Object.assign(maskedData, result.data);
    }
  });

  return { data: maskedData as Data, fulfilled: isDataComplete };
};

const isHeuristicFragmentMatch = (
  fragment: InlineFragmentNode | FragmentDefinitionNode,
  data: any,
  fragments: Record<string, FragmentDefinitionNode>
): boolean => {
  if (
    !fragment.typeCondition ||
    fragment.typeCondition.name.value === data.__typename
  )
    return true;

  return fragment.selectionSet.selections.every(selection => {
    if (selection.kind === Kind.FIELD) {
      const fieldAlias = selection.alias
        ? selection.alias.value
        : selection.name.value;
      const couldBeExcluded =
        selection.directives &&
        selection.directives.some(
          x =>
            x.name.value === 'include' ||
            x.name.value === 'skip' ||
            x.name.value === 'defer'
        );
      return data[fieldAlias] !== undefined && !couldBeExcluded;
    } else if (selection.kind === Kind.INLINE_FRAGMENT) {
      return isHeuristicFragmentMatch(selection, data, fragments);
    } else if (selection.kind === Kind.FRAGMENT_SPREAD) {
      const fragment = fragments[selection.name.value];
      return isHeuristicFragmentMatch(fragment, data, fragments);
    }
  });
};
