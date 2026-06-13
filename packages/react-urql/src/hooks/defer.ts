import type {
  FragmentDefinitionNode,
  InlineFragmentNode,
  SelectionSetNode,
} from '@0no-co/graphql.web';
import { Kind } from '@0no-co/graphql.web';
import type { AnyVariables, GraphQLRequest, OperationResult } from '@urql/core';

export type DeferredPromise = Promise<unknown> & {
  _resolve: (value?: unknown) => void;
  _resolved?: boolean;
  /** The streamed-in value, once the deferred patch has arrived.
   *
   * @remarks
   * `useFragment` reads this directly when re-masking after the promise has
   * resolved. This is what allows a deferred boundary to resolve during a
   * server stream, where the parent component holding `useQuery` won't
   * re-render to hand down fresh data via props.
   */
  _value?: unknown;
  _urqlDeferred: true;
};

export interface DeferredState {
  promises: Map<string, DeferredPromise>;
}

export const makeDeferredState = (): DeferredState => ({
  promises: new Map(),
});

export const isDeferredPromise = (value: any): value is DeferredPromise =>
  !!value && value._urqlDeferred === true && typeof value.then === 'function';

export const resolveDeferredState = (state: DeferredState) => {
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

const hasDirective = (
  node: { directives?: readonly { name: { value: string } }[] },
  name: string
): boolean => {
  const directives = (node as any)._directives;
  return !!(
    (directives && directives[name]) ||
    (node.directives && node.directives.some(x => x.name.value === name))
  );
};

const isOptionalSelection = (node: {
  directives?: readonly { name: { value: string } }[];
}): boolean => {
  return hasDirective(node, 'include') || hasDirective(node, 'skip');
};

const getFieldKey = (selection: {
  alias?: { value: string };
  name: { value: string };
}) => {
  return selection.alias ? selection.alias.value : selection.name.value;
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
  fragments: Record<string, FragmentDefinitionNode>,
  state: DeferredState,
  path: readonly (string | number)[],
  isDeferred: boolean,
  hasNext: boolean
) => {
  let next: any[] | undefined;

  for (let i = 0, l = data.length; i < l; i++) {
    const item = data[i];
    const nextItem = updateSelectionSet(
      item,
      selectionSet,
      fragments,
      state,
      [...path, i],
      isDeferred,
      hasNext
    );

    if (nextItem !== item) {
      if (!next) next = [...data];
      next[i] = nextItem;
    }
  }

  return next || data;
};

const updateSelectionSet = (
  data: any,
  selectionSet: SelectionSetNode,
  fragments: Record<string, FragmentDefinitionNode>,
  state: DeferredState,
  path: readonly (string | number)[],
  isDeferred: boolean,
  hasNext: boolean
): any => {
  if (!isObjectLike(data)) return data;

  let next: Record<string, any> | undefined;

  selectionSet.selections.forEach(selection => {
    if (selection.kind === Kind.FIELD) {
      const fieldKey = getFieldKey(selection);
      const fieldPath = [...path, fieldKey];
      const value = data[fieldKey];

      if (value === undefined) {
        if (isDeferred && hasNext && !isOptionalSelection(selection)) {
          if (!next) next = { ...data };
          next[fieldKey] = getDeferredPromise(state, fieldPath);
        } else if (!hasNext) {
          resolveDeferredPath(state, fieldPath);
        }
      } else {
        let resolvedValue = value;

        if (selection.selectionSet && value !== null) {
          resolvedValue = Array.isArray(value)
            ? updateArray(
                value,
                selection.selectionSet,
                fragments,
                state,
                fieldPath,
                isDeferred,
                hasNext
              )
            : updateSelectionSet(
                value,
                selection.selectionSet,
                fragments,
                state,
                fieldPath,
                isDeferred,
                hasNext
              );

          if (resolvedValue !== value) {
            if (!next) next = { ...data };
            next[fieldKey] = resolvedValue;
          }
        }

        // Resolve the deferred promise for this path with the streamed-in
        // value (already processed for nested defers) so a suspended
        // `useFragment` can read it without waiting on a parent rerender.
        resolveDeferredPath(state, fieldPath, resolvedValue);
      }
    } else if (selection.kind === Kind.INLINE_FRAGMENT) {
      if (!isHeuristicFragmentMatch(selection, data, fragments)) {
        return;
      }

      const nextValue = updateSelectionSet(
        next || data,
        selection.selectionSet,
        fragments,
        state,
        path,
        isDeferred || hasDirective(selection, 'defer'),
        hasNext
      );

      if (nextValue !== (next || data)) {
        next = nextValue;
      }
    } else if (selection.kind === Kind.FRAGMENT_SPREAD) {
      const fragment = fragments[selection.name.value];

      if (!fragment || !isHeuristicFragmentMatch(fragment, data, fragments)) {
        return;
      }

      const nextValue = updateSelectionSet(
        next || data,
        fragment.selectionSet,
        fragments,
        state,
        path,
        isDeferred || hasDirective(selection, 'defer'),
        hasNext
      );

      if (nextValue !== (next || data)) {
        next = nextValue;
      }
    }
  });

  return next || data;
};

const isHeuristicFragmentMatch = (
  fragment: InlineFragmentNode | FragmentDefinitionNode,
  data: any,
  fragments: Record<string, FragmentDefinitionNode>
): boolean => {
  if (
    !fragment.typeCondition ||
    fragment.typeCondition.name.value === data.__typename
  ) {
    return true;
  }

  return fragment.selectionSet.selections.every(selection => {
    if (selection.kind === Kind.FIELD) {
      const fieldKey = getFieldKey(selection);
      const couldBeExcluded =
        isOptionalSelection(selection) || hasDirective(selection, 'defer');
      return data[fieldKey] !== undefined && !couldBeExcluded;
    } else if (selection.kind === Kind.INLINE_FRAGMENT) {
      return isHeuristicFragmentMatch(selection, data, fragments);
    } else if (selection.kind === Kind.FRAGMENT_SPREAD) {
      const fragment = fragments[selection.name.value];
      return !!fragment && isHeuristicFragmentMatch(fragment, data, fragments);
    }

    return true;
  });
};

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

  const fragments = request.query.definitions.reduce<
    Record<string, FragmentDefinitionNode>
  >((acc, definition) => {
    if (definition.kind === Kind.FRAGMENT_DEFINITION) {
      acc[definition.name.value] = definition;
    }
    return acc;
  }, {});

  const data = updateSelectionSet(
    result.data,
    operation.selectionSet,
    fragments,
    state,
    [],
    false,
    result.hasNext
  );

  if (!result.hasNext) resolveDeferredState(state);

  return data === result.data ? result : { ...result, data };
};
