import {
  getMainOperation,
  normalizeVariables,
  getFragments,
  getSelectionSet,
  getName,
  getFieldArguments,
} from '../ast';

import {
  EntityField,
  OperationRequest,
  Variables,
  Fragments,
  SelectionSet,
} from '../types';

import {
  Store,
  addDependency,
  initStoreState,
  clearStoreState,
} from '../store';

import { FieldNode } from 'graphql';
import { SelectionIterator } from './shared';
import { joinKeys, keyOfField } from '../helpers';
import { SchemaPredicates } from '../ast/schemaPredicates';

interface Context {
  store: Store;
  variables: Variables;
  fragments: Fragments;
  schemaPredicates?: SchemaPredicates;
}

export const invalidate = (store: Store, request: OperationRequest) => {
  initStoreState(0);
  const operation = getMainOperation(request.query);

  const ctx: Context = {
    variables: normalizeVariables(operation, request.variables),
    fragments: getFragments(request.query),
    store,
    schemaPredicates: store.schemaPredicates,
  };

  invalidateSelection(
    ctx,
    ctx.store.getRootKey('query'),
    getSelectionSet(operation)
  );

  clearStoreState();
};

export const invalidateSelection = (
  ctx: Context,
  entityKey: string,
  select: SelectionSet
) => {
  const { store } = ctx;
  const isQuery = entityKey === 'Query';

  let typename: EntityField;
  if (!isQuery) {
    addDependency(entityKey);
    typename = store.getField(entityKey, '__typename');
    if (typeof typename !== 'string') {
      return;
    } else {
      store.writeRecord(
        undefined,
        joinKeys(entityKey, keyOfField('__typename'))
      );
    }
  } else {
    typename = entityKey;
  }

  const iter = new SelectionIterator(typename, entityKey, select, ctx);

  let node: FieldNode | void;
  while ((node = iter.next()) !== undefined) {
    const fieldName = getName(node);
    const fieldKey = joinKeys(
      entityKey,
      keyOfField(fieldName, getFieldArguments(node, ctx.variables))
    );

    if (
      process.env.NODE_ENV !== 'production' &&
      ctx.schemaPredicates &&
      typename
    ) {
      ctx.schemaPredicates.isFieldAvailableOnType(typename, fieldName);
    }

    if (isQuery) addDependency(fieldKey);

    if (node.selectionSet === undefined) {
      store.writeRecord(undefined, fieldKey);
    } else {
      const fieldSelect = getSelectionSet(node);
      const link = store.getLink(fieldKey);
      store.writeLink(undefined, fieldKey);

      if (link === undefined) {
        if (store.getRecord(fieldKey) !== undefined) {
          store.writeRecord(undefined, fieldKey);
        }
      } else if (Array.isArray(link)) {
        for (let i = 0, l = link.length; i < l; i++) {
          const childLink = link[i];
          if (childLink !== null) {
            invalidateSelection(ctx, childLink, fieldSelect);
          }
        }
      } else if (link !== null) {
        invalidateSelection(ctx, link, fieldSelect);
      }
    }
  }
};
