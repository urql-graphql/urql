/* eslint-disable react-hooks/exhaustive-deps */

import { useMemo, useCallback, useState } from 'preact/hooks';

import type {
  GraphQLRequestParams,
  AnyVariables,
  Client,
  OperationContext,
} from '@urql/core';
import { maskFragment, getFragments } from '@urql/core';

import { useClient } from '../context';
import { useRequest } from './useRequest';
import type { FragmentPromise } from './cache';
import {
  deleteFragmentPromise,
  getFragmentPromise,
  setFragmentPromise,
} from './cache';

/** Input arguments for the {@link useFragment} hook. */
export type UseFragmentArgs<Data = any, Input = Data> = {
  /** Partial {@link OperationContext} used to configure this hook.
   *
   * @remarks
   * Unlike {@link useQuery}, `useFragment` doesn’t execute a GraphQL operation,
   * so only `context.suspense` is read here. When set, it overrides the
   * {@link Client.suspense} flag for this hook and controls whether it suspends
   * while a fragment’s deferred data is still incomplete.
   */
  context?: Partial<OperationContext>;
  /** A GraphQL document to mask this fragment against.
   *
   * @remarks
   * This Document should contain atleast one FragmentDefinitionNode or
   * a FragmentDefinitionNode with the same name as the `name` property.
   */
  fragment: GraphQLRequestParams<Data, any>['query'];
  /** A JSON object containing this fragment's fields.
   *
   * @remarks
   * `Input` is separate from `Data` so fragment-reference types from gql.tada
   * and GraphQL Code Generator can be passed directly. `null` and `undefined`
   * are returned unchanged.
   */
  data: Input | null | undefined;
  /** An optional name of the fragment to use from the passed Document. */
  name?: string;
};

/** State of the masked fragment your {@link useFragment} hook returns. */
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

const hasDepsChanged = <T extends { length: number }>(a: T, b: T) => {
  for (let i = 0, l = b.length; i < l; i++) if (a[i] !== b[i]) return true;
  return false;
};

/** Hook to mask a GraphQL Fragment given its data. (BETA)
 *
 * @param args - a {@link UseFragmentArgs} object, to pass a `fragment` and `data`.
 * @returns a {@link UseFragmentState} result.
 *
 * @remarks
 * `useFragment` allows GraphQL fragments to mask their data.
 * Given {@link UseFragmentArgs.fragment} and {@link UseFragmentArgs.data}, it
 * returns the data selected by that fragment.
 *
 * Additionally, if the `suspense` option is enabled on the `Client`,
 * the `useFragment` hook will suspend instead of indicating that it’s
 * waiting for a result via {@link UseFragmentState.fetching}. This is useful
 * to render `@defer`-red parts of a query incrementally as they stream in.
 *
 * @example
 * ```ts
 * import { gql, useFragment } from '@urql/preact';
 *
 * const TodoFields = gql`
 *   fragment TodoFields on Todo { id name }
 * `;
 *
 * const Todo = (props) => {
 *   const result = useFragment({
 *     data: props.todo,
 *     fragment: TodoFields,
 *   });
 *   // ...
 * };
 * ```
 */
export function useFragment<Data = any, Input = Data>(
  args: UseFragmentArgs<Data, Input>
): UseFragmentState<Data> {
  const client = useClient();
  const suspense = isSuspense(client, args.context);

  const request = useRequest(args.fragment, EMPTY_VARIABLES);

  const fragments = useMemo(
    () => getFragments(request.query.definitions),
    [request.query]
  );

  const fragment = useMemo(
    () => (args.name ? fragments[args.name] : Object.values(fragments)[0]),
    [fragments, args.name]
  );

  if (!fragment) {
    throw new Error(
      `Passed document did not contain a fragment definition${
        args.name ? ` for "${args.name}"` : ''
      }.`
    );
  }

  const getSnapshot = useCallback(
    (
      data: Input | null | undefined,
      suspense: boolean
    ): UseFragmentState<Data> => {
      if (data == null) {
        return { data: data as null | undefined, fetching: false };
      } else if (typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('useFragment expects data to be a fragment object.');
      } else if (!suspense) {
        const newResult = maskFragment<Data>(
          data as Data,
          fragment.selectionSet,
          fragments
        );

        return { data: newResult.data, fetching: !newResult.fulfilled };
      }

      const cached = getFragmentPromise(client, fragment, data);
      const newResult = maskFragment<Data>(
        data as Data,
        fragment.selectionSet,
        fragments
      );

      if (newResult.fulfilled) {
        if (cached) {
          cached._resolve();
          deleteFragmentPromise(client, fragment, data);
        }
        return { data: newResult.data, fetching: false };
      } else if (newResult.pending) {
        // The query stream owns this promise and will resolve it directly when
        // the deferred patch is merged, which also works during server streams.
        throw newResult.pending;
      } else if (cached) {
        // We're still waiting on data and already suspended once; re-throw the
        // same promise so Preact keeps showing the suspense boundary's fallback.
        throw cached;
      } else {
        let _resolve!: () => void;
        const promise = new Promise(resolve => {
          _resolve = () => resolve(undefined);
        }) as FragmentPromise;
        promise._resolve = _resolve;
        setFragmentPromise(client, fragment, data, promise);
        throw promise;
      }
    },
    [client, fragment, fragments]
  );

  const deps = [client, request, fragment, args.data, suspense] as const;

  const [state, setState] = useState(
    () => [getSnapshot(args.data, suspense), deps] as const
  );

  const currentResult = state[0];
  if (hasDepsChanged(state[1], deps)) {
    setState([getSnapshot(args.data, suspense), deps]);
  }

  return currentResult;
}
