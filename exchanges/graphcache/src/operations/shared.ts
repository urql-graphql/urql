import { CombinedError } from '@urql/core';
import {
  GraphQLError,
  FieldNode,
  InlineFragmentNode,
  FragmentDefinitionNode,
} from 'graphql';

import {
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
import { Fragments, Variables, DataField, NullArray, Data } from '../types';
import { getFieldArguments, shouldInclude, isInterfaceOfType } from '../ast';

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
  path: Array<string | number>;
}

export const contextRef: { current: Context | null } = { current: null };

let errorMap: { [path: string]: GraphQLError } | undefined;

export const initErrorMap = (error?: CombinedError | undefined) => {
  errorMap = undefined;
  for (
    let i = 0;
    error && error.graphQLErrors && i < error.graphQLErrors.length;
    i++
  ) {
    const graphQLError = error.graphQLErrors[i];
    if (graphQLError.path && graphQLError.path.length) {
      if (!errorMap) errorMap = Object.create(null);
      errorMap![graphQLError.path.join('.')] = graphQLError;
    }
  }
};

export const isFieldMissing = (ctx: Context): boolean => {
  // Checks whether the current data field is a cache miss because of a GraphQLError
  return ctx.path.length > 0 && !!errorMap && !!errorMap[ctx.path.join('.')];
};

export const makeContext = (
  store: Store,
  variables: Variables,
  fragments: Fragments,
  typename: string,
  entityKey: string,
  optimistic?: boolean
): Context => ({
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
  path: [],
});

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
  ctx.error = errorMap && errorMap[ctx.path.join('.')];
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
  let childIterator: SelectionIterator | void;
  let index = 0;

  return function next() {
    if (childIterator !== undefined) {
      const node = childIterator();
      if (node !== undefined) {
        return node;
      }

      childIterator = undefined;
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
  x === undefined ? null : (x as Data | NullArray<Data>);
