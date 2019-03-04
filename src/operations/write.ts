import {
  getFieldAlias,
  getFieldArguments,
  getName,
  getSelectionSet,
  SelectionSet,
} from '../ast';

import { joinKeys, keyOfEntity, keyOfField } from '../helpers';
import { findOrCreate, removeLink, setLink, Store } from '../store';
import { Entity, Link } from '../types';

import { forEachFieldNode, makeContext } from './shared';
import { Context, Data, Request, Result } from './types';

export interface WriteResult {
  touched: string[];
}

/** Writes a request given its response to the store */
export const write = (store: Store, request: Request, data: Data): Result => {
  const ctx = makeContext(store, request);
  if (ctx === undefined) {
    return { isComplete: false, dependencies: [] };
  }

  const { operation } = ctx;
  const select = getSelectionSet(operation);
  const { operation: operationName } = operation;
  if (operationName === 'subscription' || operationName === 'mutation') {
    writeRoot(ctx, data, select);
  } else {
    writeEntity(ctx, operationName, data, select);
  }

  return { isComplete: true, dependencies: ctx.dependencies };
};

const writeEntity = (
  ctx: Context,
  key: string,
  data: Data,
  select: SelectionSet
) => {
  const { store } = ctx;
  const entity = findOrCreate(store, key);
  ctx.dependencies.push(key);
  writeSelection(ctx, entity, key, data, select);
};

const writeSelection = (
  ctx: Context,
  entity: Entity,
  key: string,
  data: Data,
  select: SelectionSet
) => {
  forEachFieldNode(ctx, select, node => {
    const { store, vars } = ctx;
    const fieldName = getName(node);
    const fieldValue = data[getFieldAlias(node)];
    // The field's key can include arguments if it has any
    const fieldKey = keyOfField(fieldName, getFieldArguments(node, vars));
    const childFieldKey = joinKeys(key, fieldKey);

    if (
      node.selectionSet === undefined ||
      fieldValue === null ||
      typeof fieldValue !== 'object'
    ) {
      // This is a leaf node, so we're setting the field's value directly
      entity[fieldKey] = fieldValue;
      // Remove any links that might've existed before for this field
      removeLink(store, childFieldKey);
    } else {
      // Ensure that this key exists on the entity and that previous values are thrown away
      entity[fieldKey] = null;

      // Process the field and write links for the child entities that have been written
      const { selections: fieldSelect } = node.selectionSet;
      const link = writeField(ctx, childFieldKey, fieldValue, fieldSelect);
      setLink(store, childFieldKey, link);
    }
  });
};

const writeField = (
  ctx: Context,
  parentFieldKey: string,
  data: Data | Data[] | null,
  select: SelectionSet
): Link => {
  if (Array.isArray(data)) {
    return data.map((item, index) => {
      // Append the current index to the parentFieldKey fallback
      const indexKey = joinKeys(parentFieldKey, `${index}`);
      // Recursively write array data
      const links = writeField(ctx, indexKey, item, select);
      // Link cannot be expressed as a recursive type
      return links as string | null;
    });
  } else if (data === null) {
    return null;
  }

  // Write entity to key that falls back to the given parentFieldKey
  const entityKey = keyOfEntity(data);
  const key = entityKey !== null ? entityKey : parentFieldKey;
  writeEntity(ctx, key, data, select);
  return key;
};

// This is like writeSelection but assumes no parent entity exists
const writeRoot = (ctx: Context, data: Data, select: SelectionSet) => {
  forEachFieldNode(ctx, select, node => {
    const fieldValue = data[getFieldAlias(node)];
    if (node.selectionSet !== undefined && typeof fieldValue === 'object') {
      const { selections: fieldSelect } = node.selectionSet;
      writeRootField(ctx, fieldValue, fieldSelect);
    }
  });
};

// This is like wroteField but doesn't fall back to a generated key
const writeRootField = (
  ctx: Context,
  data: Data | Data[] | null,
  select: SelectionSet
) => {
  if (Array.isArray(data)) {
    return data.map(item => writeRootField(ctx, item, select));
  } else if (data === null) {
    return;
  }

  // Write entity to key that falls back to the given parentFieldKey
  const entityKey = keyOfEntity(data);
  if (entityKey !== null) {
    writeEntity(ctx, entityKey, data, select);
  }
};
