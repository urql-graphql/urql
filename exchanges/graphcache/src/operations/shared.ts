import type { CombinedError, ErrorLike, FormattedNode } from '@urql/core';

import type {
  InlineFragmentNode,
  FragmentDefinitionNode,
  FieldNode,
} from '@0no-co/graphql.web';
import { Kind } from '@0no-co/graphql.web';

import type { SelectionSet } from '../ast';
import {
  isDeferred,
  getTypeCondition,
  getSelectionSet,
  getName,
  isOptional,
} from '../ast';

import { warn, pushDebugNode, popDebugNode } from '../helpers/help';
import {
  hasField,
  currentOperation,
  currentOptimistic,
  writeConcreteType,
  getConcreteTypes,
  isSeenConcreteType,
} from '../store/data';
import { keyOfField } from '../store/keys';
import type { Store } from '../store/store';

import { getFieldArguments, shouldInclude, isInterfaceOfType } from '../ast';

import type {
  Fragments,
  Variables,
  DataField,
  NullArray,
  Link,
  Entity,
  Data,
  Logger,
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
export let optionalRef: boolean | undefined = undefined;

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
  node: FormattedNode<InlineFragmentNode | FragmentDefinitionNode>,
  typename: void | string,
  entityKey: string,
  vars: Variables,
  logger?: Logger
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
    16,
    logger
  );

  return !getSelectionSet(node).some(node => {
    if (node.kind !== Kind.FIELD) return false;
    const fieldKey = keyOfField(getName(node), getFieldArguments(node, vars));
    return !hasField(entityKey, fieldKey);
  });
};

export class SelectionIterator {
  typename: undefined | string;
  entityKey: string;
  ctx: Context;
  stack: {
    selectionSet: FormattedNode<SelectionSet>;
    index: number;
    defer: boolean;
    optional: boolean | undefined;
  }[];

  // NOTE: Outside of this file, we expect `_defer` to always be reset to `false`
  constructor(
    typename: undefined | string,
    entityKey: string,
    _defer: false,
    _optional: undefined,
    selectionSet: FormattedNode<SelectionSet>,
    ctx: Context
  );
  // NOTE: Inside this file we expect the state to be recursively passed on
  constructor(
    typename: undefined | string,
    entityKey: string,
    _defer: boolean,
    _optional: undefined | boolean,
    selectionSet: FormattedNode<SelectionSet>,
    ctx: Context
  );

  constructor(
    typename: undefined | string,
    entityKey: string,
    _defer: boolean,
    _optional: boolean | undefined,
    selectionSet: FormattedNode<SelectionSet>,
    ctx: Context
  ) {
    this.typename = typename;
    this.entityKey = entityKey;
    this.ctx = ctx;
    this.stack = [
      {
        selectionSet,
        index: 0,
        defer: _defer,
        optional: _optional,
      },
    ];
  }

  next(): FormattedNode<FieldNode> | undefined {
    while (this.stack.length > 0) {
      let state = this.stack[this.stack.length - 1];
      while (state.index < state.selectionSet.length) {
        const select = state.selectionSet[state.index++];
        if (!shouldInclude(select, this.ctx.variables)) {
          /*noop*/
        } else if (select.kind !== Kind.FIELD) {
          // A fragment is either referred to by FragmentSpread or inline
          const fragment =
            select.kind !== Kind.INLINE_FRAGMENT
              ? this.ctx.fragments[getName(select)]
              : select;
          if (fragment) {
            const isMatching =
              !fragment.typeCondition ||
              (this.ctx.store.schema
                ? isInterfaceOfType(
                    this.ctx.store.schema,
                    fragment,
                    this.typename
                  )
                : (currentOperation === 'read' &&
                    isFragmentMatching(
                      fragment.typeCondition.name.value,
                      this.typename
                    )) ||
                  isFragmentHeuristicallyMatching(
                    fragment,
                    this.typename,
                    this.entityKey,
                    this.ctx.variables,
                    this.ctx.store.logger
                  ));
            if (
              isMatching ||
              (currentOperation === 'write' && !this.ctx.store.schema)
            ) {
              if (process.env.NODE_ENV !== 'production')
                pushDebugNode(this.typename, fragment);
              const isFragmentOptional = isOptional(select);
              if (
                isMatching &&
                fragment.typeCondition &&
                this.typename !== fragment.typeCondition.name.value
              ) {
                writeConcreteType(
                  fragment.typeCondition.name.value,
                  this.typename!
                );
              }

              this.stack.push(
                (state = {
                  selectionSet: getSelectionSet(fragment),
                  index: 0,
                  defer: state.defer || isDeferred(select, this.ctx.variables),
                  optional:
                    isFragmentOptional !== undefined
                      ? isFragmentOptional
                      : state.optional,
                })
              );
            }
          }
        } else if (currentOperation === 'write' || !select._generated) {
          deferRef = state.defer;
          optionalRef = state.optional;
          return select;
        }
      }
      this.stack.pop();
      if (process.env.NODE_ENV !== 'production') popDebugNode();
    }
    return undefined;
  }
}

const isFragmentMatching = (typeCondition: string, typename: string | void) => {
  if (!typename) return false;
  if (typeCondition === typename) return true;

  const isProbableAbstractType = !isSeenConcreteType(typeCondition);
  if (!isProbableAbstractType) return false;

  const types = getConcreteTypes(typeCondition);
  return types.size && types.has(typename);
};

export const ensureData = (x: DataField): Data | NullArray<Data> | null =>
  x == null ? null : (x as Data | NullArray<Data>);

export const ensureLink = (store: Store, ref: Link<Entity>): Link => {
  if (!ref) {
    return ref || null;
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
      12,
      store.logger
    );
  }

  return link;
};
