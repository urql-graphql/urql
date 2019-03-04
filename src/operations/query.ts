import {
  getFieldAlias,
  getFieldArguments,
  getName,
  getSelectionSet,
  SelectionSet,
} from '../ast';

import { joinKeys, keyOfField } from '../helpers';
import { find, readLink, Store } from '../store';
import { Entity, Link } from '../types';

import { forEachFieldNode, makeContext } from './shared';
import { Context, Data, Request, Result } from './types';

/** Reads a request entirely from the store */
export const query = (store: Store, request: Request): Result => {
  const ctx = makeContext(store, request);
  if (ctx === undefined) {
    return { isComplete: false, dependencies: [] };
  }

  const select = getSelectionSet(ctx.operation);
  const data = readEntity(ctx, 'query', select);

  return {
    data,
    isComplete: ctx.isComplete,
    dependencies: ctx.dependencies,
  };
};

const readEntity = (
  ctx: Context,
  key: string,
  select: SelectionSet
): Data | null => {
  const { store } = ctx;
  const entity = find(store, key);
  if (entity === null) {
    // Cache Incomplete: A missing entity for a key means it wasn't cached
    ctx.isComplete = false;
    return null;
  } else if (key !== 'query') {
    ctx.dependencies.push(key);
  }

  const data = Object.create(null);
  readSelection(ctx, entity, key, data, select);
  return data;
};

const readSelection = (
  ctx: Context,
  entity: Entity,
  key: string,
  data: Data,
  select: SelectionSet
): void => {
  const { store, vars } = ctx;

  forEachFieldNode(ctx, select, node => {
    const fieldName = getName(node);
    // The field's key can include arguments if it has any
    const fieldKey = keyOfField(fieldName, getFieldArguments(node, vars));
    const fieldValue = entity[fieldKey];
    const fieldAlias = getFieldAlias(node);
    const childFieldKey = joinKeys(key, fieldKey);
    if (key === 'query') {
      ctx.dependencies.push(childFieldKey);
    }

    if (node.selectionSet === undefined || fieldValue !== null) {
      // Cache Incomplete: An undefined field value means it wasn't cached
      ctx.isComplete = fieldValue !== undefined;
      data[fieldAlias] = fieldValue === undefined ? null : fieldValue;
    } else {
      // null values mean that a field might be linked to other entities
      const { selections: fieldSelect } = node.selectionSet;
      const link = readLink(store, childFieldKey);

      // Cache Incomplete: A missing link for a field means it's not cached
      if (link === undefined) {
        ctx.isComplete = false;
        data[fieldAlias] = null;
      } else {
        data[fieldAlias] = readField(ctx, link, fieldSelect);
      }
    }
  });
};

const readField = (
  ctx: Context,
  link: Link,
  select: SelectionSet
): null | Data | Data[] => {
  if (Array.isArray(link)) {
    // @ts-ignore: Link cannot be expressed as a recursive type
    return link.map(childLink => readField(ctx, childLink, select));
  } else if (link === null) {
    return null;
  }

  return readEntity(ctx, link, select);
};
