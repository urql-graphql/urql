import * as React from 'react';

import type {
  GraphQLRequestParams,
  AnyVariables,
  Client,
  CombinedError,
  FragmentSnapshot,
  OperationContext,
} from '@urql/core';
import { makeFragmentStore } from '@urql/core';

import { useClient } from '../context';
import { useRequest } from './useRequest';

/** Input arguments for the {@link useFragment} hook. */
export type UseFragmentArgs<Data = any, Input = Data> = {
  /** Partial {@link OperationContext}; only `context.suspense` is read.
   *
   * @remarks
   * When set, it overrides the {@link Client.suspense} flag for this hook and
   * controls whether it suspends while deferred data is streaming in.
   */
  context?: Partial<OperationContext>;
  /** A GraphQL document containing the fragment to read. */
  fragment: GraphQLRequestParams<Data, any>['query'];
  /** The fragment reference the parent passed down.
   *
   * @remarks
   * `Input` is separate from `Data` so fragment-reference types from gql.tada
   * and GraphQL Code Generator can be passed directly.
   */
  data: Input | null | undefined;
  /** An optional name of the fragment to use from the passed document. */
  name?: string;
};

/** State of the fragment your {@link useFragment} hook is reading.
 *
 * @remarks
 * `data` is set once every field of the fragment is present. It is the object
 * the parent passed down (or its streamed-in successor), not a copy, so it is
 * referentially stable and can itself be passed on as a fragment reference.
 */
export interface UseFragmentState<Data> {
  /** `true` while a `@defer`-red patch for this fragment is streaming in. */
  fetching: boolean;
  data: Data | null | undefined;
  /** GraphQL errors under this fragment's path when its deferred data failed. */
  error?: CombinedError;
}

const EMPTY_VARIABLES: AnyVariables = {};

const isSuspense = (client: Client, context?: Partial<OperationContext>) =>
  context && context.suspense !== undefined
    ? !!context.suspense
    : client.suspense;

const getEntityKey = (data: any): unknown =>
  data && data.__typename && data.id != null
    ? `${data.__typename}:${data.id}`
    : data;

/** Hook to read a GraphQL fragment from the data its parent passed down. (BETA)
 *
 * @remarks
 * When the parent query spreads this fragment with `@defer`, the reference is
 * incomplete until the deferred patch streams in. With Suspense enabled the
 * hook suspends until then — also during server streaming, as the data is read
 * from the query's stream rather than from a parent rerender — and throws to
 * the nearest error boundary if the patch never arrives. Without Suspense it
 * reports `fetching` and `error` instead.
 *
 * @example
 * ```ts
 * const Todo = (props) => {
 *   const { data } = useFragment({ fragment: TodoFields, data: props.todo });
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

  const store = React.useMemo(
    () =>
      makeFragmentStore<Data, Input>({
        fragment: request.query,
        data: args.data,
        name: args.name,
      }),
    [request.query, args.data, args.name]
  );

  const snapshot = store.getSnapshot();
  const [, forceUpdate] = React.useReducer((x: number) => x + 1, 0);

  React.useEffect(() => {
    const unsubscribe = store.subscribe(forceUpdate);
    // A patch may have arrived between render and subscription.
    if (store.getSnapshot() !== snapshot) forceUpdate();
    return unsubscribe;
  }, [store]);

  // A refetch that streams again hands down an incomplete reference for an
  // entity this hook has already shown; keep showing it rather than falling
  // back to a Suspense boundary.
  const committed = React.useRef<FragmentSnapshot<Data> | null>(null);
  React.useEffect(() => {
    if (snapshot.data != null) committed.current = snapshot;
  });

  if (snapshot.fetching) {
    const previous = committed.current;
    if (previous && getEntityKey(previous.data) === getEntityKey(args.data)) {
      return { fetching: true, data: previous.data };
    } else if (suspense) {
      throw store.wait();
    }
  } else if (suspense && snapshot.error) {
    throw snapshot.error;
  }

  return snapshot;
}
