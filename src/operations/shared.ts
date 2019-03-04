import { FieldNode } from 'graphql';

import {
  getFragmentSelectionSets,
  getMainOperation,
  getName,
  getNormalizedVars,
  getSelectionSet,
  isFieldNode,
  isInlineFragment,
  SelectionSet,
  shouldInclude,
} from '../ast';

import { Store } from '../store';
import { Context, Request } from './types';

export const makeContext = (store: Store, request: Request): void | Context => {
  const { query, variables } = request;
  const operation = getMainOperation(query);
  if (operation === undefined) {
    return;
  }

  const dependencies = [];
  const fragments = getFragmentSelectionSets(query);
  const vars = getNormalizedVars(operation, variables);
  const isComplete = true;

  return { dependencies, isComplete, operation, fragments, vars, store };
};

export const forEachFieldNode = (
  ctx: Context,
  select: SelectionSet,
  cb: (node: FieldNode) => void
) => {
  const { vars, fragments } = ctx;

  select.forEach(node => {
    if (!shouldInclude(node, vars)) {
      // Directives instruct this node to be skipped
      return;
    } else if (!isFieldNode(node)) {
      // This is a fragment (either inline or spread)
      const fragmentSelect = isInlineFragment(node)
        ? getSelectionSet(node)
        : fragments[getName(node)];
      // Recursively process the fragments' selection sets
      forEachFieldNode(ctx, fragmentSelect, cb);
    } else {
      cb(node);
    }
  });
};

export const merge = (dest, src) => {
  if (src !== null && typeof src === 'object') {
    for (const key in src) {
      const srcVal = src[key];
      if (!(key in dest)) {
        dest[key] = srcVal;
      } else {
        merge(dest[key], srcVal);
      }
    }
  }
};
