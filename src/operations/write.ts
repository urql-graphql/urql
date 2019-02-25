import graphql from '../exec';
import { keyForLink, keyOfEntity } from '../keys';
import Store from '../store';

import {
  Entity,
  FieldResolver,
  FieldValue,
  Link,
  Request,
  Result,
} from '../types';

// Determines whether a fieldValue consists of only entities
const isLinkableEntity = (x: FieldValue) => {
  if (Array.isArray(x)) {
    // @ts-ignore
    return x.every(isLinkableEntity);
  }

  return x === null || (typeof x === 'object' && keyOfEntity(x) !== null);
};

// Transforms a fieldValue to keys of entities
const linkOfEntity = (x: FieldValue): Link => {
  if (Array.isArray(x)) {
    // @ts-ignore
    return x.map(linkOfEntity);
  } else if (x === null || typeof x !== 'object') {
    return null;
  }

  return keyOfEntity(x);
};

const writeResolver: FieldResolver = (
  fieldName,
  rootValue,
  args,
  { store },
  info
) => {
  const fieldValue = rootValue[info.resultKey || fieldName];
  const parentKey = keyOfEntity(rootValue);

  if (parentKey === null) {
    return null;
  } else if (parentKey === 'Mutation' || parentKey === 'Subscription') {
    // We do traverse but we don't store Mutation & Subscription themselves
    return fieldValue;
  } else if (fieldValue === null || fieldValue === undefined) {
    // Clear stored field since value is null
    store.writeEntityValue(parentKey, fieldName, null);
    return null;
  } else if (info.isLeaf || typeof fieldValue !== 'object') {
    // Write leaf / scalar value to parent
    store.writeEntityValue(parentKey, fieldName, fieldValue);
    return null;
  }

  // Determine if this is a link and not a scalar
  const shouldCreateLink = isLinkableEntity(fieldValue);
  if (!shouldCreateLink) {
    // Write object-like scalar to parent
    store.writeEntityValue(parentKey, fieldName, fieldValue);
    return null;
  }

  // Clear stored field since it's not a scalar
  store.writeEntityValue(parentKey, fieldName, null);

  // Write link to store and keep traversing
  const link = linkOfEntity(fieldValue);
  store.writeLink(keyForLink(parentKey, fieldName, args), link);
  return fieldValue;
};

const write = (store: Store, request: Request, response: Entity): Result => {
  const context = { isComplete: true, store };
  graphql(writeResolver, request, response, context);
  const dependencies = store.flushTouched();
  return { isComplete: true, dependencies };
};

export default write;
