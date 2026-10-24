import type { DocumentNode, SelectionSetNode } from '@0no-co/graphql.web';
import { Kind } from '@0no-co/graphql.web';

import type { OperationResult } from '../types';
import { getFieldKey, getFragments, hasDirective } from './selection';
import type { FragmentMap } from './selection';

/** The part of an operation's selection set that leads to `@defer`-red
 * fragments.
 *
 * @remarks
 * Only fields on a path towards a deferred fragment are kept, so walking a
 * result with a skeleton visits the objects that can host deferred data and
 * nothing else.
 *
 * @internal
 */
interface Skeleton {
  /** Whether objects at this level carry a `@defer`-red fragment. */
  hostsDefer: boolean;
  fields: Map<string, Skeleton>;
}

/** The stream a piece of fragment data came from. (BETA)
 *
 * @remarks
 * One channel exists per active streamed query. It holds the latest result so
 * a fragment can read its own data at its `path` without a parent rerender.
 *
 * @internal
 */
export interface OwnerChannel {
  result: OperationResult | null;
  /** The stream delivered its final result (`hasNext: false`). */
  done: boolean;
  /** The stream was torn down before its final result. */
  aborted: boolean;
  listeners: Set<() => void>;
  /** Settles on the next change; stable until then, so Suspense can throw it. */
  next: Promise<void>;
  settle: () => void;
}

/** Where a piece of fragment data sits within its owning query's result.
 *
 * @internal
 */
export interface FragmentOwner {
  channel: OwnerChannel;
  path: readonly (string | number)[];
}

const owners = new WeakMap<object, FragmentOwner>();
const skeletons = new WeakMap<DocumentNode, Skeleton | null>();

/** Returns the owner of a fragment reference, if it came from a stream.
 *
 * @internal
 */
export const getFragmentOwner = (data: object): FragmentOwner | undefined =>
  owners.get(data);

const buildSkeleton = (
  selectionSet: SelectionSetNode,
  fragments: FragmentMap,
  target: Skeleton,
  visited: Set<string>
): void => {
  for (const selection of selectionSet.selections) {
    if (selection.kind === Kind.FIELD) {
      if (!selection.selectionSet) continue;
      const key = getFieldKey(selection);
      const child: Skeleton = target.fields.get(key) || {
        hostsDefer: false,
        fields: new Map(),
      };
      buildSkeleton(selection.selectionSet, fragments, child, visited);
      if (child.hostsDefer || child.fields.size) target.fields.set(key, child);
    } else {
      // Type conditions are deliberately ignored: without schema information
      // an interface or union condition can't be matched against data, and
      // recording an object that turns out not to need it is harmless.
      if (hasDirective(selection, 'defer')) target.hostsDefer = true;
      if (selection.kind === Kind.INLINE_FRAGMENT) {
        buildSkeleton(selection.selectionSet, fragments, target, visited);
      } else {
        const name = selection.name.value;
        const fragment = fragments[name];
        if (fragment && !visited.has(name)) {
          visited.add(name);
          buildSkeleton(fragment.selectionSet, fragments, target, visited);
          visited.delete(name);
        }
      }
    }
  }
};

/** Returns the defer skeleton of a document, or `null` when it has no `@defer`.
 *
 * @internal
 */
export const getDeferSkeleton = (query: DocumentNode): Skeleton | null => {
  let skeleton = skeletons.get(query);
  if (skeleton === undefined) {
    const operation = query.definitions.find(
      x => x.kind === Kind.OPERATION_DEFINITION
    );
    const root: Skeleton = { hostsDefer: false, fields: new Map() };
    if (operation && operation.kind === Kind.OPERATION_DEFINITION) {
      buildSkeleton(
        operation.selectionSet,
        getFragments(query.definitions),
        root,
        new Set()
      );
    }
    skeleton = root.hostsDefer || root.fields.size ? root : null;
    skeletons.set(query, skeleton);
  }
  return skeleton;
};

const record = (
  data: any,
  skeleton: Skeleton,
  channel: OwnerChannel,
  path: (string | number)[]
): void => {
  if (typeof data !== 'object' || data === null) return;
  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++)
      record(data[i], skeleton, channel, path.concat(i));
    return;
  }
  if (skeleton.hostsDefer) owners.set(data, { channel, path });
  skeleton.fields.forEach((child, key) => {
    if (data[key] != null) record(data[key], child, channel, path.concat(key));
  });
};

/** Creates the channel for one streamed query. (BETA)
 *
 * @internal
 */
export const makeOwnerChannel = (): OwnerChannel => {
  const channel = {
    result: null,
    done: false,
    aborted: false,
    listeners: new Set(),
  } as unknown as OwnerChannel;
  const arm = () => {
    channel.next = new Promise<void>(resolve => {
      channel.settle = () => {
        arm();
        resolve();
      };
    });
  };
  arm();
  return channel;
};

/** Records which objects in a streamed result can host deferred data. (BETA)
 *
 * @remarks
 * Called by the `Client` for every result of a query whose document contains
 * `@defer`. Recording stops once the stream completes, so later cache updates
 * cost nothing; a refetch that streams again starts recording again.
 *
 * @internal
 */
export const updateOwnerChannel = (
  channel: OwnerChannel,
  skeleton: Skeleton,
  result: OperationResult
): void => {
  const streaming =
    result.hasNext || (channel.result && channel.result.hasNext);
  if (!streaming) return;
  channel.result = result;
  channel.done = !result.hasNext;
  if (result.data) record(result.data, skeleton, channel, []);
  channel.listeners.forEach(listener => listener());
  channel.settle();
};

/** Marks a channel's stream as ended. (BETA)
 *
 * @remarks
 * Waiting Suspense boundaries are released so they can re-render and observe
 * the outcome, but subscribers aren't notified: a torn-down query is normally
 * replaced by a new one whose data reaches components through their props.
 *
 * @internal
 */
export const endOwnerChannel = (channel: OwnerChannel): void => {
  if (!channel.done) channel.aborted = true;
  channel.done = true;
  channel.settle();
};
