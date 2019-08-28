import { forEachFieldNode } from './shared';
import { Store, initStoreState, clearStoreState } from '../store';
import { OperationRequest, Variables, Fragments, SelectionSet } from '../types';
import {
  getMainOperation,
  normalizeVariables,
  getFragments,
  getSelectionSet,
  getName,
  getFieldArguments,
} from '../ast';
import { joinKeys, keyOfField } from '../helpers';

interface Context {
  store: Store;
  variables: Variables;
  fragments: Fragments;
}

export const invalidate = (store: Store, request: OperationRequest) => {
  initStoreState(0);
  const operation = getMainOperation(request.query);

  const ctx: Context = {
    variables: normalizeVariables(operation, request.variables),
    fragments: getFragments(request.query),
    store,
  };

  invalidateSelection(ctx, 'Query', getSelectionSet(operation));

  clearStoreState();
};

export const invalidateSelection = (
  ctx: Context,
  entityKey: string,
  select: SelectionSet
) => {
  const { store, variables } = ctx;
  const typename = store.getField(entityKey, '__typename');
  if (typeof typename !== 'string') return null;

  forEachFieldNode(typename, entityKey, select, ctx, node => {
    const fieldName = getName(node);
    const fieldArgs = getFieldArguments(node, variables);
    const fieldKey = joinKeys(entityKey, keyOfField(fieldName, fieldArgs));

    if (node.selectionSet === undefined) {
      store.removeRecord(fieldKey);
    } else {
      const fieldSelect = getSelectionSet(node);
      const link = store.getLink(fieldKey);
      store.removeLink(fieldKey);
      if (link === undefined) {
        if (store.getRecord(fieldKey) !== undefined)
          store.removeRecord(fieldKey);
      } else if (Array.isArray(link)) {
        link.forEach(l => l && invalidateSelection(ctx, l, fieldSelect));
      } else if (link !== null) {
        invalidateSelection(ctx, link, fieldSelect);
      }
    }
  });
};
