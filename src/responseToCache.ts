import graphql, { ExecInfo } from 'graphql-anywhere';
import { keyForLink, keyOfEntity } from './keys';

import {
  deleteFieldValue,
  getOrCreateEntity,
  writeFieldValue,
  writeLink,
} from './cacheUtils';

import {
  Cache,
  Context,
  Entity,
  GqlValue,
  GraphQLRequest,
  Link,
} from './types';

// Determines whether a fieldValue consists of only entities
const isLinkableEntity = (x: GqlValue | Entity | Array<Entity | GqlValue>) => {
  if (Array.isArray(x)) {
    // @ts-ignore
    return x.every(isLinkableEntity);
  }

  return x === null || (typeof x === 'object' && keyOfEntity(x) !== null);
};

// Transforms a fieldValue to keys of entities
const linkOfEntity = (
  x: GqlValue | Entity | Array<Entity | GqlValue>
): Link => {
  if (Array.isArray(x)) {
    // @ts-ignore
    return x.map(linkOfEntity);
  } else if (x === null || typeof x !== 'object') {
    return null;
  }

  return keyOfEntity(x);
};

export const responseResolver = (
  fieldName: string,
  rootValue: Entity,
  args: null | object,
  { cache }: Context,
  info: ExecInfo
) => {
  const fieldValue = rootValue[fieldName];
  const parentKey = keyOfEntity(rootValue);

  if (parentKey === null) {
    return null;
  } else if (parentKey === 'Mutation' || parentKey === 'Subscription') {
    // We do traverse but we don't cache Mutation & Subscription themselves
    return fieldValue;
  }

  const parentEntity = getOrCreateEntity(cache, parentKey);
  if (fieldValue === null || fieldValue === undefined) {
    // Clear cached field since value is null
    deleteFieldValue(parentEntity, fieldName);
    return null;
  } else if (info.isLeaf || typeof fieldValue !== 'object') {
    // Write leaf / scalar value to parent
    writeFieldValue(parentEntity, fieldName, fieldValue);
    return null;
  }

  // Determine if this is a link and not a scalar
  const shouldCreateLink = isLinkableEntity(fieldValue);
  if (!shouldCreateLink) {
    // Write object-like scalar to parent
    writeFieldValue(parentEntity, fieldName, fieldValue);
    return null;
  }

  // Clear cached field since it's not a scalar
  deleteFieldValue(parentEntity, fieldName);

  const link = linkOfEntity(fieldValue);
  if (link === null) {
    return null;
  }

  // Write link to cache and keep traversing
  writeLink(cache, keyForLink(parentKey, fieldName, args), link);
  return fieldValue;
};

const responseToCache = (
  cache: Cache,
  request: GraphQLRequest,
  response: Entity
): Entity => {
  const context = { cache };

  return graphql(
    responseResolver,
    request.query,
    response,
    context,
    request.variables
  );
};

export default responseToCache;
