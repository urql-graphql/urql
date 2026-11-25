import type { Source } from 'wonka';
import { make } from 'wonka';
import type {
  FragmentDefinitionNode,
  InlineFragmentNode,
  SelectionSetNode,
} from '@0no-co/graphql.web';
import { Kind } from '@0no-co/graphql.web';

import type { GraphQLRequestParams, OperationResult } from '../types';
import { CombinedError } from './error';
import { createRequest } from './request';
import {
  getFieldKey,
  getFragments,
  hasDirective,
  isOptionalSelection,
} from './selection';
import type { FragmentMap } from './selection';
import { getFragmentOwner } from './fragmentOwner';

/** Input arguments for {@link makeFragmentStore} and {@link makeFragmentSource}. (BETA)
 *
 * @beta
 */
export interface FragmentSourceArgs<Data = any, Input = Data> {
  /** A GraphQL document containing the fragment definition to read. */
  fragment: GraphQLRequestParams<Data, any>['query'];
  /** The fragment reference: the object the parent selected the fragment on.
   *
   * @remarks
   * `Input` is separate from `Data` so opaque fragment-reference types from
   * gql.tada and GraphQL Code Generator can be passed directly.
   */
  data: Input | null | undefined;
  /** An optional name of the fragment to use from the passed document. */
  name?: string;
}

/** The state of a fragment reference. (BETA)
 *
 * @remarks
 * `data` is only set once every field the fragment selects is present, and is
 * the reference object itself (or its streamed-in successor), never a copy.
 * While `fetching` is `true` a `@defer`-red patch for this data is in flight.
 * When the owning query ends without delivering it, `error` holds the GraphQL
 * errors reported under this data's path.
 *
 * @beta
 */
export interface FragmentSnapshot<Data> {
  fetching: boolean;
  data: Data | null | undefined;
  error?: CombinedError;
}

/** A subscribable view of one fragment reference. (BETA)
 *
 * @remarks
 * `getSnapshot` returns the same object until the data changes, so it can be
 * fed to `useSyncExternalStore`-style bindings directly.
 *
 * @beta
 */
export interface FragmentStore<Data> {
  getSnapshot(): FragmentSnapshot<Data>;
  subscribe(onChange: () => void): () => void;
  /** A promise that settles on the next change while `fetching`, for Suspense. */
  wait(): Promise<void> | undefined;
}

const getIn = (data: any, path: readonly (string | number)[]): any => {
  for (let i = 0; i < path.length && data != null; i++) data = data[path[i]];
  return data;
};

const isSameEntity = (a: any, b: any): boolean =>
  a.__typename === b.__typename &&
  (a.id == null || b.id == null || a.id === b.id);

/** Returns the response key of the first missing required field, if any.
 *
 * @remarks
 * Fields under `@include`/`@skip` and the fragment's own `@defer`-red
 * selections are optional. A nested type condition that doesn't name the
 * data's `__typename` only counts when some of its fields are present, since
 * an abstract type can't be matched without schema information.
 *
 * @internal
 */
const findMissing = (
  data: any,
  selectionSet: SelectionSetNode,
  fragments: FragmentMap
): string | undefined => {
  for (const selection of selectionSet.selections) {
    if (isOptionalSelection(selection)) continue;
    if (selection.kind === Kind.FIELD) {
      const key = getFieldKey(selection);
      const value = data[key];
      if (value === undefined) return key;
      if (value === null || !selection.selectionSet) continue;
      const items = Array.isArray(value) ? value : [value];
      for (const item of items) {
        if (item == null) continue;
        const missing = findMissing(item, selection.selectionSet, fragments);
        if (missing) return `${key}.${missing}`;
      }
    } else if (!hasDirective(selection, 'defer')) {
      const fragment: InlineFragmentNode | FragmentDefinitionNode | undefined =
        selection.kind === Kind.INLINE_FRAGMENT
          ? selection
          : fragments[selection.name.value];
      if (!fragment) continue;
      const missing = findMissing(data, fragment.selectionSet, fragments);
      if (
        missing &&
        (!fragment.typeCondition ||
          fragment.typeCondition.name.value === data.__typename ||
          !isUnmatched(data, fragment.selectionSet))
      ) {
        return missing;
      }
    }
  }
};

const isUnmatched = (data: any, selectionSet: SelectionSetNode): boolean =>
  selectionSet.selections.every(
    selection =>
      selection.kind !== Kind.FIELD ||
      selection.name.value === '__typename' ||
      data[getFieldKey(selection)] === undefined
  );

const scopeError = (
  result: OperationResult | null,
  path: readonly (string | number)[],
  name: string,
  aborted: boolean
): CombinedError => {
  const errors = result && result.error ? result.error.graphQLErrors : [];
  const scoped = errors.filter(
    error =>
      error.path && path.every((segment, i) => error.path![i] === segment)
  );
  return scoped.length
    ? new CombinedError({
        graphQLErrors: scoped,
        response: result!.error!.response,
      })
    : new CombinedError({
        graphQLErrors: [
          aborted
            ? `The query owning fragment "${name}" ended before its deferred data arrived.`
            : `Deferred data for fragment "${name}" was not delivered.`,
        ],
      });
};

const warned = new WeakSet<object>();

/** Creates a {@link FragmentStore} for a fragment reference. (BETA)
 *
 * @remarks
 * A reference whose fields are all present is returned as-is. A reference
 * missing fields because a `@defer`-red patch is still streaming in is
 * `fetching` until the owning query delivers it, and then resolves to the
 * streamed-in object read from that query's latest result — no parent rerender
 * needed, which is what makes this work during server streaming. If the query
 * ends without delivering it, the snapshot carries an `error`.
 *
 * A reference missing fields that no query will deliver (a test fixture, or
 * data from another source) is returned as-is with a development warning; a
 * store never waits on something that can't resolve.
 *
 * @beta
 */
export const makeFragmentStore = <Data = any, Input = Data>(
  args: FragmentSourceArgs<Data, Input>
): FragmentStore<Data> => {
  const request = createRequest(args.fragment, {});
  const fragment = request.query.definitions.find(
    definition =>
      definition.kind === Kind.FRAGMENT_DEFINITION &&
      (!args.name || definition.name.value === args.name)
  ) as FragmentDefinitionNode | undefined;

  if (!fragment) {
    throw new Error(
      `Passed document did not contain a fragment definition${
        args.name ? ` for "${args.name}"` : ''
      }.`
    );
  }

  const data = args.data as any;
  if (data != null && (typeof data !== 'object' || Array.isArray(data))) {
    throw new Error('A fragment reference must be an object.');
  }

  const fragments = getFragments(request.query.definitions);
  const owner = data != null ? getFragmentOwner(data) : undefined;
  const name = fragment.name.value;

  let snapshot: FragmentSnapshot<Data> | undefined;
  let seenResult: OperationResult | null | undefined;
  let seenDone: boolean | undefined;

  const compute = (): FragmentSnapshot<Data> => {
    if (data == null) return { fetching: false, data };
    const missing = findMissing(data, fragment.selectionSet, fragments);
    if (!missing) return { fetching: false, data };

    if (!owner) {
      if (process.env.NODE_ENV !== 'production' && !warned.has(data)) {
        warned.add(data);
        console.warn(
          `Fragment "${name}" is missing "${missing}" and no streamed query will deliver it. Returning the data as-is.`
        );
      }
      return { fetching: false, data };
    }

    const { channel, path } = owner;
    const latest = channel.result && getIn(channel.result.data, path);
    if (
      latest &&
      latest !== data &&
      isSameEntity(latest, data) &&
      !findMissing(latest, fragment.selectionSet, fragments)
    ) {
      return { fetching: false, data: latest };
    }

    return channel.done
      ? {
          fetching: false,
          data: undefined,
          error: scopeError(channel.result, path, name, channel.aborted),
        }
      : { fetching: true, data: undefined };
  };

  const getSnapshot = (): FragmentSnapshot<Data> => {
    const result = owner ? owner.channel.result : null;
    const done = owner ? owner.channel.done : true;
    if (!snapshot || result !== seenResult || done !== seenDone) {
      const next = compute();
      // Keep the previous snapshot object when nothing observable changed.
      if (
        !snapshot ||
        next.fetching !== snapshot.fetching ||
        next.data !== snapshot.data ||
        !!next.error !== !!snapshot.error
      ) {
        snapshot = next;
      }
      seenResult = result;
      seenDone = done;
    }
    return snapshot;
  };

  return {
    getSnapshot,
    subscribe(onChange) {
      if (!owner) return () => {};
      owner.channel.listeners.add(onChange);
      return () => {
        owner.channel.listeners.delete(onChange);
      };
    },
    wait() {
      return getSnapshot().fetching && owner ? owner.channel.next : undefined;
    },
  };
};

/** Creates a {@link Source} of {@link FragmentSnapshot}s for a fragment reference. (BETA)
 *
 * @remarks
 * Issues the current snapshot synchronously, re-issues it as deferred patches
 * arrive, and completes once the snapshot is no longer `fetching`. This is the
 * primitive for bindings without Suspense (Vue, Svelte, Solid).
 *
 * @beta
 */
export const makeFragmentSource = <Data = any, Input = Data>(
  args: FragmentSourceArgs<Data, Input>
): Source<FragmentSnapshot<Data>> => {
  const store = makeFragmentStore<Data, Input>(args);
  return make<FragmentSnapshot<Data>>(observer => {
    let last = store.getSnapshot();
    observer.next(last);
    if (!last.fetching) {
      observer.complete();
      return () => {};
    }
    let unsubscribe = () => {};
    const check = () => {
      const next = store.getSnapshot();
      if (next === last) return;
      observer.next((last = next));
      if (!next.fetching) {
        unsubscribe();
        observer.complete();
      }
    };
    unsubscribe = store.subscribe(check);
    // A torn-down owner doesn't notify subscribers; observe it via `wait`.
    const pending = store.wait();
    if (pending) pending.then(check);
    return () => unsubscribe();
  });
};
