import graphql, { ExecInfo } from 'graphql-anywhere';

import Cache from '../cache';
import { keyForLink, keyOfEntity } from '../keys';
import { CacheResult, Entity, Link, Request, Scalar } from '../types';

// Determines whether a fieldValue consists of only entities
const isLinkableEntity = (x: Scalar | Entity | Array<Entity | Scalar>) => {
  if (Array.isArray(x)) {
    // @ts-ignore
    return x.every(isLinkableEntity);
  }

  return x === null || (typeof x === 'object' && keyOfEntity(x) !== null);
};

// Transforms a fieldValue to keys of entities
const linkOfEntity = (x: Scalar | Entity | Array<Entity | Scalar>): Link => {
  if (Array.isArray(x)) {
    // @ts-ignore
    return x.map(linkOfEntity);
  } else if (x === null || typeof x !== 'object') {
    return null;
  }

  return keyOfEntity(x);
};

const writeResolver = (
  fieldName: string,
  rootValue: Entity,
  args: null | object,
  cache: Cache,
  info: ExecInfo
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
  graphql(writeResolver, request.query, response, cache, request.variables);
  const dependencies = cache.flushTouched();
  return { dependencies };
};

export default write;
