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
import { isDeferredPromise } from './defer';

import { hasDepsChanged } from './state';

/** Input arguments for the {@link useFragment} hook. */
export type UseFragmentArgs<Data = any> = {
  /** Partial {@link OperationContext} used to configure this hook.
   *
   * @remarks
   * Unlike {@link useQuery}, `useFragment` doesn’t execute a GraphQL operation,
   * so only `context.suspense` is read here. When set, it overrides the
   * {@link Client.suspense} flag for this hook and controls whether it suspends
   * while a fragment’s deferred data is still incomplete.
   *
   * @example
   * ```ts
   * const result = useFragment({
   *   query,
   *   data,
   *   context: { suspense: true },
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
   * When `useFragment` is masking a fragment whose data isn’t fully present
   * yet — for instance while a `@defer`-red part of it is still streaming in —
   * `fetching` is set to `true` until the remaining data arrives.
   */
  fetching: boolean;
  /** The data for the masked fragment. */
  data?: Data | null;
}

const EMPTY_VARIABLES: AnyVariables = {};

const isSuspense = (client: Client, context?: Partial<OperationContext>) =>
  context && context.suspense !== undefined
    ? !!context.suspense
    : client.suspense;

/** Derives a cache key for a fragment’s suspense promise.
 *
 * @remarks
 * The base {@link GraphQLRequest.key} only identifies the fragment document, so
 * it’s shared across every `useFragment` hook using the same fragment. To avoid
 * sibling hooks (e.g. items in a list) sharing — and prematurely resolving —
 * each other’s suspense promises, we fold the entity’s identity (`__typename`
 * and `id`/`_id`) into the key when it’s available.
 */
const getFragmentCacheKey = (
  request: GraphQLRequest<any, AnyVariables>,
  data: any
): number => {
  let key = request.key;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const id = data.id != null ? data.id : data._id;
    if (data.__typename != null && id != null) {
      const identity = `${data.__typename}:${id}`;
      for (let i = 0, l = identity.length; i < l; i++)
        key = (key << 5) + key + identity.charCodeAt(i);
    }
  }
  return key;
};

/** Hook to mask a GraphQL Fragment given its data. (BETA)
 *
 * @param args - a {@link UseFragmentArgs} object, to pass a `fragment` and `data`.
 * @returns a {@link UseFragmentState} result.
 *
 * @remarks
 * `useFragment` allows GraphQL fragments to mask their data.
 * Given {@link UseFragmentArgs.query} and {@link UseFragmentArgs.data}, it will
 * return the masked data for the fragment contained in query.
 *
 * Additionally, if the `suspense` option is enabled on the `Client`,
 * the `useFragment` hook will suspend instead of indicating that it’s
 * waiting for a result via {@link UseFragmentState.fetching}. This is useful
 * to render `@defer`-red parts of a query incrementally as they stream in.
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

  const request = useRequest(args.query, EMPTY_VARIABLES);

  const fragment = React.useMemo(() => {
    return request.query.definitions.find(
      x =>
        x.kind === Kind.FRAGMENT_DEFINITION &&
        ((args.name && x.name.value === args.name) || !args.name)
    ) as FragmentDefinitionNode | undefined;
  }, [request.query, args.name]);

  if (!fragment) {
    throw new Error(
      `Passed document did not contain a fragment definition${
        args.name ? ` for "${args.name}"` : ''
      }.`
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

      const key = getFragmentCacheKey(request, data);
      const cached = cache.get(key);
      const newResult = maskFragment<Data>(
        data,
        fragment.selectionSet,
        fragments
      );

      if (newResult.fulfilled) {
        if (cached) {
          cached._resolve();
          cache.dispose(key);
        }
        return { data: newResult.data, fetching: false };
      } else if (newResult.pending) {
        // The query stream owns this promise and will resolve it directly when
        // the deferred patch is merged, which also works during server streams.
        throw newResult.pending;
      } else if (cached) {
        // We're still waiting on data and already suspended once; re-throw the
        // same promise so React keeps showing the suspense boundary's fallback.
        throw cached;
      } else {
        let _resolve!: () => void;
        const promise = new Promise(resolve => {
          _resolve = () => resolve(undefined);
        }) as FragmentPromise;
        promise._resolve = _resolve;
        cache.set(key, promise);
        throw promise;
      }
    },
    [cache, fragment, fragments]
  );

  const deps = [client, request, args.data, suspense] as const;

  const [state, setState] = React.useState(
    () => [getSnapshot(request, args.data, suspense), deps] as const
  );

  const currentResult = state[0];
  if (hasDepsChanged(state[1], deps)) {
    setState([getSnapshot(request, args.data, suspense), deps]);
  }

  return currentResult;
}

const maskFragment = <Data>(
  data: Data,
  selectionSet: SelectionSetNode,
  fragments: Record<string, FragmentDefinitionNode>
): { data: Data; fulfilled: boolean; pending?: Promise<unknown> } => {
  const maskedData = {};
  let isDataComplete = true;
  let pending: Promise<unknown> | undefined;

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

      let value = data[fieldAlias];
      if (isDeferredPromise(value)) {
        if (!value._resolved) {
          // The deferred patch hasn't arrived yet; suspend on the stream-owned
          // promise. `useQuery` resolves it directly when the patch is merged.
          // The promise is preserved on the masked data so that a nested
          // `useFragment` rendering this field can suspend on it in turn.
          isDataComplete = false;
          if (!pending) pending = value;
          maskedData[fieldAlias] = value;
          return;
        }
        // The deferred patch has streamed in: read its value directly off the
        // resolved promise, rather than relying on a parent rerender to hand
        // down fresh data via props (which doesn't happen during SSR streams).
        value = value._value;
      }

      if (value === undefined) {
        if (hasIncludeOrSkip) return;
        isDataComplete = false;
      } else if (value === null) {
        maskedData[fieldAlias] = null;
      } else if (Array.isArray(value)) {
        if (selection.selectionSet) {
          maskedData[fieldAlias] = value.map(item => {
            const result = maskFragment(
              item,
              selection.selectionSet as SelectionSetNode,
              fragments
            );

            if (!result.fulfilled) {
              isDataComplete = false;
              if (!pending) pending = result.pending;
            }

            return result.data;
          });
        } else {
          maskedData[fieldAlias] = value.map(item => item);
        }
      } else {
        if (selection.selectionSet) {
          const result = maskFragment(value, selection.selectionSet, fragments);

          if (!result.fulfilled) {
            isDataComplete = false;
            if (!pending) pending = result.pending;
          }

          maskedData[fieldAlias] = result.data;
        } else {
          maskedData[fieldAlias] = value;
        }
      }
    } else if (selection.kind === Kind.INLINE_FRAGMENT) {
      if (!isHeuristicFragmentMatch(selection, data, fragments)) {
        return;
      }

      const hasDefer =
        selection.directives &&
        selection.directives.some(x => x.name.value === 'defer');

      const result = maskFragment(data, selection.selectionSet, fragments);
      if (!result.fulfilled && !hasIncludeOrSkip && !hasDefer) {
        isDataComplete = false;
        if (!pending) pending = result.pending;
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
        if (!pending) pending = result.pending;
      }
      Object.assign(maskedData, result.data);
    }
  });

  return { data: maskedData as Data, fulfilled: isDataComplete, pending };
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
      return !!fragment && isHeuristicFragmentMatch(fragment, data, fragments);
    }
  });
};
