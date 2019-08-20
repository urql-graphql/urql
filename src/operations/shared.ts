import { FieldNode, InlineFragmentNode, FragmentDefinitionNode } from 'graphql';
import { Fragments, Variables, SelectionSet } from '../types';
import { Store } from '../store';
import { joinKeys, keyOfField } from '../helpers';

import {
  getTypeCondition,
  getFieldArguments,
  shouldInclude,
  isFieldNode,
  isInlineFragment,
  getSelectionSet,
  getName,
} from '../ast';

interface Context {
  store: Store;
  variables: Variables;
  fragments: Fragments;
}

const isFragmentMatching = (
  node: InlineFragmentNode | FragmentDefinitionNode,
  typename: string,
  entityKey: string,
  ctx: Context
) => {
  if (typename === getTypeCondition(node)) {
    return true;
  }

  // This is a heuristic for now, but temporary until schema awareness becomes a thing
  return !getSelectionSet(node).some(node => {
    if (!isFieldNode(node)) return false;
    const fieldName = getName(node);
    const fieldArgs = getFieldArguments(node, ctx.variables);
    const fieldKey = keyOfField(fieldName, fieldArgs);
    return !ctx.store.hasField(joinKeys(entityKey, fieldKey));
  });
};

export const forEachFieldNode = (
  typename: string,
  entityKey: string,
  select: SelectionSet,
  ctx: Context,
  cb: (node: FieldNode) => void
) => {
  select.forEach(node => {
    if (!shouldInclude(node, ctx.variables)) {
      // Directives instruct this node to be skipped
      return;
    } else if (!isFieldNode(node)) {
      // A fragment is either referred to by FragmentSpread or inline
      const fragmentNode = isInlineFragment(node)
        ? node
        : ctx.fragments[getName(node)];
      if (
        fragmentNode !== undefined &&
        isFragmentMatching(fragmentNode, typename, entityKey, ctx)
      ) {
        const fragmentSelect = getSelectionSet(fragmentNode);
        forEachFieldNode(typename, entityKey, fragmentSelect, ctx, cb);
      }
    } else if (getName(node) !== '__typename') {
      cb(node);
    }
  });
};
