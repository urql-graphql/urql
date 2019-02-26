import Store from '../store';
import { graphql, keyForLink } from '../utils';
import { makeCustomResolver } from './custom';

import {
  Entity,
  FieldResolver,
  FieldValue,
  Link,
  Request,
  Result,
} from '../types';

// Determines whether a fieldValue consists of only entities
const isLinkableEntity = (store: Store, x: FieldValue) => {
  if (Array.isArray(x)) {
    // @ts-ignore
    return x.every(inner => isLinkableEntity(store, inner));
  }

  return x === null || (typeof x === 'object' && store.keyOfEntity(x) !== null);
};

// Transforms a fieldValue to keys of entities
const linkOfEntity = (store: Store, x: FieldValue): Link => {
  if (Array.isArray(x)) {
    // @ts-ignore
    return x.map(inner => linkOfEntity(store, inner));
  } else if (x === null || typeof x !== 'object') {
    return null;
  }

  return store.keyOfEntity(x);
};

const writeResolver: FieldResolver = (
  fieldName,
  rootValue,
  args,
  { store },
  info
) => {
  const fieldValue = rootValue[info.resultKey || fieldName];
  const parentKey = store.keyOfEntity(rootValue);

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
  const shouldCreateLink = isLinkableEntity(store, fieldValue);
  if (!shouldCreateLink) {
    // Write object-like scalar to parent
    store.writeEntityValue(parentKey, fieldName, fieldValue);
    return null;
  }

  // Clear stored field since it's not a scalar
  store.writeEntityValue(parentKey, fieldName, undefined);

  // Write link to store and keep traversing
  const link = linkOfEntity(store, fieldValue);
  store.writeLink(keyForLink(parentKey, fieldName, args), link);
  return fieldValue;
};

const resolver = makeCustomResolver(writeResolver);

const write = (store: Store, request: Request, response: Entity): Result => {
  graphql(resolver, request, response, {
    isComplete: true,
    store,
    operation: 'write',
  });

  const dependencies = store.flushTouched();
  return { isComplete: true, dependencies };
};

export default write;
