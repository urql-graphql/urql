import type { SelectionSetNode } from '@0no-co/graphql.web';
import { Kind } from '@0no-co/graphql.web';

import { isDeferredPromise } from './defer';
import {
  getFieldKey,
  hasDirective,
  isHeuristicFragmentMatch,
  isOptionalSelection,
  type FragmentMap,
} from './selection';

/** The result of masking a piece of `data` against a selection set. (BETA)
 *
 * @beta
 */
export interface MaskFragmentResult<Data> {
  /** The masked data, limited to the fields the selection set selects. */
  data: Data;
  /** Whether every selected field is present (not still streaming in). */
  fulfilled: boolean;
  /** A {@link DeferredPromise} that resolves once a still-missing `@defer`-red
   * field arrives, if any. Bindings can throw this to suspend. */
  pending?: Promise<unknown>;
}

/** Masks `data` against a fragment’s selection set. (BETA)
 *
 * @param data - the (super-)set of data to mask.
 * @param selectionSet - the {@link SelectionSetNode} to mask `data` against.
 * @param fragments - a {@link FragmentMap} of fragments referenced by the selection set.
 * @returns a {@link MaskFragmentResult}.
 *
 * @remarks
 * `maskFragment` walks the selection set and returns the subset of `data` that
 * the selection selects. When a non-optional field is still missing — for
 * instance while a `@defer`-red part is streaming in — `fulfilled` is `false`
 * and, if the query stream installed a {@link DeferredPromise} for it, that
 * promise is surfaced via `pending`.
 *
 * Bindings decide what to do with an incomplete result: a Suspense-based
 * binding throws `pending`, while others surface `fetching: !fulfilled`.
 *
 * Note: masked data may transiently contain a still-pending
 * {@link DeferredPromise} on a `@defer`-red field while it streams in, so that a
 * nested consumer rendering that field can suspend on it in turn.
 *
 * @beta
 */
export const maskFragment = <Data>(
  data: Data,
  selectionSet: SelectionSetNode,
  fragments: FragmentMap
): MaskFragmentResult<Data> => {
  const maskedData = {};
  let isDataComplete = true;
  let pending: Promise<unknown> | undefined;

  selectionSet.selections.forEach(selection => {
    const hasIncludeOrSkip = isOptionalSelection(selection);

    if (selection.kind === Kind.FIELD) {
      const fieldAlias = getFieldKey(selection);

      let value = data[fieldAlias];
      if (isDeferredPromise(value)) {
        if (!value._resolved) {
          // The deferred patch hasn't arrived yet; surface the stream-owned
          // promise so a binding can suspend on it. The promise is preserved on
          // the masked data so that a nested consumer rendering this field can
          // suspend on it in turn.
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
            if (item === null) return null;

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

      const hasDefer = hasDirective(selection, 'defer');

      const result = maskFragment(data, selection.selectionSet, fragments);
      if (!result.fulfilled && !hasIncludeOrSkip && !hasDefer) {
        isDataComplete = false;
        if (!pending) pending = result.pending;
      }

      Object.assign(maskedData, result.data);
    } else if (selection.kind === Kind.FRAGMENT_SPREAD) {
      const fragment = fragments[selection.name.value];

      const hasDefer = hasDirective(selection, 'defer');

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
