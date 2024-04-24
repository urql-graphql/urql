/* eslint-disable react-hooks/exhaustive-deps */

import * as React from 'react';
import type {
  FragmentDefinitionNode,
  InlineFragmentNode,
  SelectionSetNode,
  DocumentNode,
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
import { getFragmentCacheForClient } from './cache';

import { hasDepsChanged } from './state';
import { keyDocument } from '@urql/core/utils';

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
  const fragment = React.useMemo(() => {
    let document: DocumentNode;
    if (typeof args.query === 'string') {
      document = keyDocument(args.query);
    } else {
      document = args.query;
    }

    return document.definitions.find(
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

  const request = useRequest(
    args.query,
    getKeyForEntity(args.data, fragment.typeCondition.name.value)
  );

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
        } else if (suspense) {
          const promise = new Promise(() => {});
          cache.set(request.key, promise);
          throw promise;
        } else {
          return { fetching: true, data: newResult.data };
        }
      } else if (suspense && cached != null && 'then' in cached) {
        const newResult = maskFragment<Data>(
          data,
          fragment.selectionSet,
          fragments
        );

        if (!newResult.fulfilled) {
          throw cached;
        } else {
          cache.dispose(request.key);
          return { data: newResult.data, fetching: false };
        }
      }

      const newResult = maskFragment<Data>(
        data,
        fragment.selectionSet,
        fragments
      );

      return { fetching: false, data: newResult.data };
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

const getKeyForEntity = (
  entity: any,
  typeCondition: string
): { id: string; __typename: string } | {} => {
  if (!entity) return {};

  let key = entity.id || entity._id;
  const typename = entity.__typename;

  if (!key) {
    const keyable = Object.keys(entity).reduce((acc, key) => {
      if (typeof entity[key] === 'string' || typeof entity[key] === 'number') {
        acc[key] = entity[key];
      }

      return acc;
    }, {});
    key = JSON.stringify(keyable);
  }

  return { id: key, __typename: typename || typeCondition };
};

const maskFragment = <Data>(
  data: Data,
  selectionSet: SelectionSetNode,
  fragments: Record<string, FragmentDefinitionNode>
): { data: Data; fulfilled: boolean } => {
  const maskedData = {};
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

      if (data[fieldAlias] === undefined) {
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
