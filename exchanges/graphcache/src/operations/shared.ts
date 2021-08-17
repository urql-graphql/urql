import { CombinedError } from '@urql/core';
import {
  GraphQLError,
  FieldNode,
  InlineFragmentNode,
  FragmentDefinitionNode,
} from 'graphql';

import {
  isDeferred,
  isInlineFragment,
  getTypeCondition,
  getSelectionSet,
  getName,
  SelectionSet,
  isFieldNode,
} from '../ast';

import { warn, pushDebugNode, popDebugNode } from '../helpers/help';
import { hasField } from '../store/data';
import { Store, keyOfField } from '../store';

import { getFieldArguments, shouldInclude, isInterfaceOfType } from '../ast';

import {
  Fragments,
  Variables,
  DataField,
  NullArray,
  Link,
  Entity,
  Data,
} from '../types';

export interface Context {
  store: Store;
  variables: Variables;
  fragments: Fragments;
  parentTypeName: string;
  parentKey: string;
  parentFieldKey: string;
  parent: Data;
  fieldName: string;
  error: GraphQLError | undefined;
  partial: boolean;
  optimistic: boolean;
  __internal: {
    path: Array<string | number>;
    errorMap: { [path: string]: GraphQLError } | undefined;
  };
}

export const contextRef: { current: Context | null } = { current: null };
export const deferRef: { current: boolean } = { current: false };

// Checks whether the current data field is a cache miss because of a GraphQLError
export const getFieldError = (ctx: Context): GraphQLError | undefined =>
  ctx.__internal.path.length > 0 && ctx.__internal.errorMap
    ? ctx.__internal.errorMap[ctx.__internal.path.join('.')]
    : undefined;

export const makeContext = (
  store: Store,
  variables: Variables,
  fragments: Fragments,
  typename: string,
  entityKey: string,
  optimistic?: boolean,
  error?: CombinedError | undefined
): Context => {
  const ctx: Context = {
    store,
    variables,
    fragments,
    parent: { __typename: typename },
    parentTypeName: typename,
    parentKey: entityKey,
    parentFieldKey: '',
    fieldName: '',
    error: undefined,
    partial: false,
    optimistic: !!optimistic,
    __internal: {
      path: [],
      errorMap: undefined,
    },
  };

  if (error && error.graphQLErrors) {
    for (let i = 0; i < error.graphQLErrors.length; i++) {
      const graphQLError = error.graphQLErrors[i];
      if (graphQLError.path && graphQLError.path.length) {
        if (!ctx.__internal.errorMap)
          ctx.__internal.errorMap = Object.create(null);
        ctx.__internal.errorMap![graphQLError.path.join('.')] = graphQLError;
      }
    }
  }

  return ctx;
};

export const updateContext = (
  ctx: Context,
  data: Data,
  typename: string,
  entityKey: string,
  fieldKey: string,
  fieldName: string
) => {
  contextRef.current = ctx;
  ctx.parent = data;
  ctx.parentTypeName = typename;
  ctx.parentKey = entityKey;
  ctx.parentFieldKey = fieldKey;
  ctx.fieldName = fieldName;
  ctx.error = getFieldError(ctx);
};

const isFragmentHeuristicallyMatching = (
  node: InlineFragmentNode | FragmentDefinitionNode,
  typename: void | string,
  entityKey: string,
  vars: Variables
) => {
  if (!typename) return false;
  const typeCondition = getTypeCondition(node);
  if (!typeCondition || typename === typeCondition) return true;

  warn(
    'Heuristic Fragment Matching: A fragment is trying to match against the `' +
      typename +
      '` type, ' +
      'but the type condition is `' +
      typeCondition +
      '`. Since GraphQL allows for interfaces `' +
      typeCondition +
      '` may be an' +
      'interface.\nA schema needs to be defined for this match to be deterministic, ' +
      'otherwise the fragment will be matched heuristically!',
    16
  );

  return !getSelectionSet(node).some(node => {
    if (!isFieldNode(node)) return false;
    const fieldKey = keyOfField(getName(node), getFieldArguments(node, vars));
    return !hasField(entityKey, fieldKey);
  });
};

interface SelectionIterator {
  (): FieldNode | undefined;
}

export const makeSelectionIterator = (
  typename: void | string,
  entityKey: string,
  select: SelectionSet,
  ctx: Context
): SelectionIterator => {
  let childDeferred = false;
  let childIterator: SelectionIterator | void;
  let index = 0;

  return function next() {
    if (!deferRef.current && childDeferred) deferRef.current = childDeferred;

    if (childIterator) {
      const node = childIterator();
      if (node != null) {
        return node;
      }

      childIterator = undefined;
      childDeferred = false;
      if (process.env.NODE_ENV !== 'production') {
        popDebugNode();
      }
    }

    while (index < select.length) {
      const node = select[index++];
      if (!shouldInclude(node, ctx.variables)) {
        continue;
      } else if (!isFieldNode(node)) {
        // A fragment is either referred to by FragmentSpread or inline
        const fragmentNode = !isInlineFragment(node)
          ? ctx.fragments[getName(node)]
          : node;

        if (fragmentNode !== undefined) {
          const isMatching = ctx.store.schema
            ? isInterfaceOfType(ctx.store.schema, fragmentNode, typename)
            : isFragmentHeuristicallyMatching(
                fragmentNode,
                typename,
                entityKey,
                ctx.variables
              );
          if (isMatching) {
            if (process.env.NODE_ENV !== 'production') {
              pushDebugNode(typename, fragmentNode);
            }

            childDeferred = !!isDeferred(node, ctx.variables);
            if (!deferRef.current && childDeferred)
              deferRef.current = childDeferred;

            return (childIterator = makeSelectionIterator(
              typename,
              entityKey,
              getSelectionSet(fragmentNode),
              ctx
            ))();
          }
        }
      } else {
        return node;
      }
    }
  };
};

export const ensureData = (x: DataField): Data | NullArray<Data> | null =>
  x == null ? null : (x as Data | NullArray<Data>);

export const ensureLink = (store: Store, ref: Link<Entity>): Link => {
  if (ref == null) {
    return ref;
  } else if (Array.isArray(ref)) {
    const link = new Array(ref.length);
    for (let i = 0, l = link.length; i < l; i++)
      link[i] = ensureLink(store, ref[i]);
    return link;
  }

  const link = store.keyOfEntity(ref);
  if (!link && ref && typeof ref === 'object') {
    warn(
      "Can't generate a key for link(...) item." +
        '\nYou have to pass an `id` or `_id` field or create a custom `keys` config for `' +
        ref.__typename +
        '`.',
      12
    );
  }

  return link;
};
