import Cache from '../cache';
import graphql from '../exec';
import { keyForLink, keyOfEntity } from '../keys';

import {
  CacheResult,
  Entity,
  FieldResolver,
  FieldValue,
  Link,
  Request,
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
  cache,
  info
) => {
  const fieldValue = rootValue[info.resultKey || fieldName];
  const parentKey = keyOfEntity(rootValue);

  if (parentKey === null) {
    return null;
  } else if (parentKey === 'Mutation' || parentKey === 'Subscription') {
    // We do traverse but we don't cache Mutation & Subscription themselves
    return fieldValue;
  } else if (fieldValue === null || fieldValue === undefined) {
    // Clear cached field since value is null
    cache.writeEntityValue(parentKey, fieldName, null);
    return null;
  } else if (info.isLeaf || typeof fieldValue !== 'object') {
    // Write leaf / scalar value to parent
    cache.writeEntityValue(parentKey, fieldName, fieldValue);
    return null;
  }

  // Determine if this is a link and not a scalar
  const shouldCreateLink = isLinkableEntity(fieldValue);
  if (!shouldCreateLink) {
    // Write object-like scalar to parent
    cache.writeEntityValue(parentKey, fieldName, fieldValue);
    return null;
  }

  // Clear cached field since it's not a scalar
  cache.writeEntityValue(parentKey, fieldName, null);

  // Write link to cache and keep traversing
  const link = linkOfEntity(fieldValue);
  cache.writeLink(keyForLink(parentKey, fieldName, args), link);
  return fieldValue;
};

const write = (
  cache: Cache,
  request: Request,
  response: Entity
): CacheResult => {
  graphql(writeResolver, request, response, cache);
  const dependencies = cache.flushTouched();
  return { dependencies };
};

export default write;
