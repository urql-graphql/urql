import { CombinedError, ErrorLike } from '@urql/core';

import {
  FieldNode,
  InlineFragmentNode,
  FragmentDefinitionNode,
} from '@0no-co/graphql.web';

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
import { hasField, currentOperation, currentOptimistic } from '../store/data';
import { keyOfField } from '../store/keys';
import { Store } from '../store/store';

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
  error: ErrorLike | undefined;
  partial: boolean;
  hasNext: boolean;
  optimistic: boolean;
  __internal: {
    path: Array<string | number>;
    errorMap: { [path: string]: ErrorLike } | undefined;
  };
}

export let contextRef: Context | null = null;
export let deferRef = false;

// Checks whether the current data field is a cache miss because of a GraphQLError
export const getFieldError = (ctx: Context): ErrorLike | undefined =>
  ctx.__internal.path.length > 0 && ctx.__internal.errorMap
    ? ctx.__internal.errorMap[ctx.__internal.path.join('.')]
    : undefined;

export const makeContext = (
  store: Store,
  variables: Variables,
  fragments: Fragments,
  typename: string,
  entityKey: string,
  error: CombinedError | undefined
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
    hasNext: false,
    optimistic: currentOptimistic,
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
  contextRef = ctx;
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
      '` may be an ' +
      'interface.\nA schema needs to be defined for this match to be deterministic, ' +
      'otherwise the fragment will be matched heuristically!',
    16
  );

  return (
    currentOperation === 'write' ||
    !getSelectionSet(node).some(node => {
      if (!isFieldNode(node)) return false;
      const fieldKey = keyOfField(getName(node), getFieldArguments(node, vars));
      return !hasField(entityKey, fieldKey);
    })
  );
};

interface SelectionIterator {
  (): FieldNode | undefined;
}

export const makeSelectionIterator = (
  typename: void | string,
  entityKey: string,
  defer: boolean,
  selectionSet: SelectionSet,
  ctx: Context
): SelectionIterator => {
  let child: SelectionIterator | void;
  let index = 0;

  return function next() {
    let node: FieldNode | undefined;
    while (child || index < selectionSet.length) {
      node = undefined;
      deferRef = defer;
      if (child) {
        if ((node = child())) {
          return node;
        } else {
          child = undefined;
          if (process.env.NODE_ENV !== 'production') popDebugNode();
        }
      } else {
        const select = selectionSet[index++];
        if (!shouldInclude(select, ctx.variables)) {
          /*noop*/
        } else if (!isFieldNode(select)) {
          // A fragment is either referred to by FragmentSpread or inline
          const fragment = !isInlineFragment(select)
            ? ctx.fragments[getName(select)]
            : select;
          if (fragment) {
            const isMatching =
              !fragment.typeCondition ||
              (ctx.store.schema
                ? isInterfaceOfType(ctx.store.schema, fragment, typename)
                : isFragmentHeuristicallyMatching(
                    fragment,
                    typename,
                    entityKey,
                    ctx.variables
                  ));
            if (isMatching) {
              if (process.env.NODE_ENV !== 'production')
                pushDebugNode(typename, fragment);
              child = makeSelectionIterator(
                typename,
                entityKey,
                defer || isDeferred(select, ctx.variables),
                getSelectionSet(fragment),
                ctx
              );
            }
          }
        } else {
          return select;
        }
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
