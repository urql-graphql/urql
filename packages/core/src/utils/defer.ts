import type { SelectionSetNode } from '@0no-co/graphql.web';
import { Kind } from '@0no-co/graphql.web';
import type { AnyVariables, GraphQLRequest, OperationResult } from '../types';
import {
  getFieldKey,
  getFragments,
  hasDirective,
  isHeuristicFragmentMatch,
  isOptionalSelection,
  type FragmentMap,
} from './selection';

/** A stable {@link Promise} associated with a field inside a `@defer`-red
 * selection that hasn’t arrived yet. (BETA)
 *
 * @remarks
 * Framework bindings can throw this promise to suspend (or read its resolved
 * `_value`) so a `@defer`-red boundary can resolve directly from the query
 * stream — without depending on a parent component re-render to hand fresh data
 * down via props (which doesn’t happen during server streams).
 *
 * The promise is stored in sidecar metadata rather than in GraphQL result data,
 * so an {@link OperationResult} always retains its declared data shape.
 *
 * @beta
 */
export type DeferredPromise = Promise<unknown> & {
  _resolve: (value?: unknown) => void;
  _resolved?: boolean;
  /** The streamed-in value, once the deferred patch has arrived. */
  _value?: unknown;
  _urqlDeferred: true;
};

/** Per-operation state tracking the {@link DeferredPromise}s associated with a
 * streamed result, keyed by their path in the result data. (BETA)
 *
 * @beta
 */
export interface DeferredState {
  promises: Map<string, DeferredPromise>;
}

/** Creates an empty {@link DeferredState}. (BETA)
 *
 * @beta
 */
export const makeDeferredState = (): DeferredState => ({
  promises: new Map(),
});

/** Returns whether a value is a {@link DeferredPromise}. (BETA)
 *
 * @beta
 */
export const isDeferredPromise = (value: any): value is DeferredPromise =>
  !!value && value._urqlDeferred === true && typeof value.then === 'function';

/** Sidecar metadata for missing deferred fields.
 *
 * @remarks
 * A WeakMap keeps internal promises out of user-visible GraphQL data and lets
 * abandoned result objects and their promises be garbage-collected.
 *
 * @internal
 */
const deferredFields = new WeakMap<object, Map<string, DeferredPromise>>();

/** Returns the deferred promise associated with a response field, if any.
 *
 * @internal
 */
export const getDeferredFieldPromise = (
  data: object,
  fieldKey: string
): DeferredPromise | undefined => {
  const fields = deferredFields.get(data);
  return fields ? fields.get(fieldKey) : undefined;
};

/** Associates a deferred promise with a response field without changing data.
 *
 * @internal
 */
export const setDeferredFieldPromise = (
  data: object,
  fieldKey: string,
  promise: DeferredPromise
): void => {
  let fields = deferredFields.get(data);
  if (!fields) deferredFields.set(data, (fields = new Map()));
  fields.set(fieldKey, promise);
};

/** Copies deferred field associations while merging masked selections.
 *
 * @internal
 */
export const copyDeferredFields = (source: object, target: object): void => {
  const fields = deferredFields.get(source);
  if (fields) {
    fields.forEach((promise, fieldKey) => {
      setDeferredFieldPromise(target, fieldKey, promise);
    });
  }
};

/** Resolves and clears every pending {@link DeferredPromise} in a
 * {@link DeferredState}. (BETA)
 *
 * @remarks
 * This is called when a stream ends (`hasNext` becomes falsy) or when the
 * operation is torn down, so no boundary stays suspended indefinitely.
 *
 * @beta
 */
export const resolveDeferredState = (state: DeferredState): void => {
  state.promises.forEach(promise => promise._resolve());
  state.promises.clear();
};

const makeDeferredPromise = (): DeferredPromise => {
  let resolve!: () => void;
  const promise = new Promise<void>(_resolve => {
    resolve = _resolve;
  }) as DeferredPromise;

  promise._resolved = false;
  promise._urqlDeferred = true;
  promise._resolve = (value?: unknown) => {
    if (!promise._resolved) {
      promise._resolved = true;
      promise._value = value;
      resolve();
    }
  };

  return promise;
};

const getPathKey = (path: readonly (string | number)[]) => JSON.stringify(path);

const getDeferredPromise = (
  state: DeferredState,
  path: readonly (string | number)[]
) => {
  const key = getPathKey(path);
  let promise = state.promises.get(key);

  if (!promise || promise._resolved) {
    promise = makeDeferredPromise();
    state.promises.set(key, promise);
  }

  return promise;
};

const resolveDeferredPath = (
  state: DeferredState,
  path: readonly (string | number)[],
  value?: unknown
) => {
  const key = getPathKey(path);
  const promise = state.promises.get(key);
  if (promise) {
    promise._resolve(value);
    state.promises.delete(key);
  }
};

const isObjectLike = (value: unknown): value is Record<string, any> =>
  typeof value === 'object' && value !== null;

const updateArray = (
  data: readonly any[],
  selectionSet: SelectionSetNode,
  fragments: FragmentMap,
  state: DeferredState,
  path: readonly (string | number)[],
  isDeferred: boolean,
  hasNext: boolean
): void => {
  for (let i = 0, l = data.length; i < l; i++) {
    updateSelectionSet(
      data[i],
      selectionSet,
      fragments,
      state,
      [...path, i],
      isDeferred,
      hasNext
    );
  }
};

const updateSelectionSet = (
  data: any,
  selectionSet: SelectionSetNode,
  fragments: FragmentMap,
  state: DeferredState,
  path: readonly (string | number)[],
  isDeferred: boolean,
  hasNext: boolean
): void => {
  if (!isObjectLike(data)) return;

  selectionSet.selections.forEach(selection => {
    if (selection.kind === Kind.FIELD) {
      const fieldKey = getFieldKey(selection);
      const fieldPath = [...path, fieldKey];
      const value = data[fieldKey];

      if (value === undefined) {
        if (isDeferred && hasNext && !isOptionalSelection(selection)) {
          setDeferredFieldPromise(
            data,
            fieldKey,
            getDeferredPromise(state, fieldPath)
          );
        } else if (!hasNext) {
          resolveDeferredPath(state, fieldPath);
        }
      } else {
        if (selection.selectionSet && value !== null) {
          if (Array.isArray(value)) {
            updateArray(
              value,
              selection.selectionSet,
              fragments,
              state,
              fieldPath,
              isDeferred,
              hasNext
            );
          } else {
            updateSelectionSet(
              value,
              selection.selectionSet,
              fragments,
              state,
              fieldPath,
              isDeferred,
              hasNext
            );
          }
        }

        // Resolve the deferred promise for this path with the streamed-in value
        // so a suspended consumer can read it without a parent rerender.
        resolveDeferredPath(state, fieldPath, value);
      }
    } else if (selection.kind === Kind.INLINE_FRAGMENT) {
      if (!isHeuristicFragmentMatch(selection, data, fragments)) return;

      updateSelectionSet(
        data,
        selection.selectionSet,
        fragments,
        state,
        path,
        isDeferred || hasDirective(selection, 'defer'),
        hasNext
      );
    } else if (selection.kind === Kind.FRAGMENT_SPREAD) {
      const fragment = fragments[selection.name.value];
      if (!fragment || !isHeuristicFragmentMatch(fragment, data, fragments)) {
        return;
      }

      updateSelectionSet(
        data,
        fragment.selectionSet,
        fragments,
        state,
        path,
        isDeferred || hasDirective(selection, 'defer'),
        hasNext
      );
    }
  });
};

/** Associates and resolves {@link DeferredPromise}s for fields in a streamed
 * {@link OperationResult} without changing its GraphQL data. (BETA)
 *
 * @remarks
 * While `result.hasNext` is `true`, missing non-optional fields inside a
 * `@defer`-red selection are associated with stable {@link DeferredPromise}s in
 * sidecar metadata. As later patches arrive, the promises are resolved with the
 * streamed-in value and removed from the operation state. When the stream ends,
 * all remaining promises are resolved.
 *
 * Bindings call this on each result of a suspense-enabled query stream so that
 * `@defer`-red fragment boundaries can resolve directly from the stream while
 * `result.data` remains safe for ordinary consumers.
 *
 * @beta
 */
export const updateDeferredResult = <
  Data = any,
  Variables extends AnyVariables = AnyVariables,
>(
  request: GraphQLRequest<Data, Variables>,
  result: OperationResult<Data, Variables>,
  state: DeferredState
): OperationResult<Data, Variables> => {
  if (!result.data) {
    if (!result.hasNext) resolveDeferredState(state);
    return result;
  }

  const operation = request.query.definitions.find(
    definition => definition.kind === Kind.OPERATION_DEFINITION
  );

  if (!operation || operation.kind !== Kind.OPERATION_DEFINITION) {
    if (!result.hasNext) resolveDeferredState(state);
    return result;
  }

  updateSelectionSet(
    result.data,
    operation.selectionSet,
    getFragments(request.query.definitions),
    state,
    [],
    false,
    result.hasNext
  );

  if (!result.hasNext) resolveDeferredState(state);
  return result;
};
