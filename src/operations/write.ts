import Store from '../store';
import { Entity, FieldResolver, Request, Result } from '../types';
import { graphql, keyForLink } from '../utils';
import { makeCustomResolver } from './custom';

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
  const shouldCreateLink = store.isLinkableEntity(fieldValue);
  if (!shouldCreateLink) {
    // Write object-like scalar to parent
    store.writeEntityValue(parentKey, fieldName, fieldValue);
    return null;
  }

  // Clear stored field since it's not a scalar
  store.writeEntityValue(parentKey, fieldName, undefined);

  // Write link to store and keep traversing
  const link = store.linkOfEntity(fieldValue);
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
