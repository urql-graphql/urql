import { FieldNode } from 'graphql';

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

import * as InMemoryData from '../store/data';
import { Store, keyOfField } from '../store';
import { isFieldAvailableOnType } from '../ast';
import { SelectionIterator } from './shared';

interface Context {
  store: Store;
  variables: Variables;
  fragments: Fragments;
}

export const invalidate = (store: Store, request: OperationRequest) => {
  const operation = getMainOperation(request.query);

  const ctx: Context = {
    variables: normalizeVariables(operation, request.variables),
    fragments: getFragments(request.query),
    store,
  };

  invalidateSelection(
    ctx,
    ctx.store.getRootKey('query'),
    getSelectionSet(operation)
  );
};

export const invalidateSelection = (
  ctx: Context,
  entityKey: string,
  select: SelectionSet
) => {
  const isQuery = entityKey === 'Query';

  let typename: EntityField;
  if (!isQuery) {
    typename = InMemoryData.readRecord(entityKey, '__typename');
    if (typeof typename !== 'string') {
      return;
    } else {
      InMemoryData.writeRecord(entityKey, '__typename', undefined);
    }
  } else {
    typename = entityKey;
  }

  const iter = new SelectionIterator(typename, entityKey, select, ctx);

  let node: FieldNode | void;
  while ((node = iter.next()) !== undefined) {
    const fieldName = getName(node);
    const fieldKey = keyOfField(
      fieldName,
      getFieldArguments(node, ctx.variables)
    );

    if (process.env.NODE_ENV !== 'production' && ctx.store.schema && typename) {
      isFieldAvailableOnType(ctx.store.schema, typename, fieldName);
    }

    if (node.selectionSet === undefined) {
      InMemoryData.writeRecord(entityKey, fieldKey, undefined);
    } else {
      const fieldSelect = getSelectionSet(node);
      const link = InMemoryData.readLink(entityKey, fieldKey);

      InMemoryData.writeLink(entityKey, fieldKey, undefined);
      InMemoryData.writeRecord(entityKey, fieldKey, undefined);

      if (Array.isArray(link)) {
        for (let i = 0, l = link.length; i < l; i++) {
          const childLink = link[i];
          if (childLink !== null) {
            invalidateSelection(ctx, childLink, fieldSelect);
          }
        }
      } else if (link) {
        invalidateSelection(ctx, link, fieldSelect);
      }
    }
  }
};
