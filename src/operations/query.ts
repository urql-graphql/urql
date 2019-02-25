import graphql from '../exec';
import { keyForLink, keyOfEntity } from '../keys';
import Store from '../store';
import { FieldResolver, Link, Request, Result } from '../types';

const entityOfLink = (store: Store, link: Link) => {
  if (Array.isArray(link)) {
    // @ts-ignore
    return link.map(inner => entityOfLink(store, inner));
  } else if (link === null || typeof link !== 'string') {
    return null;
  }

  return store.getEntity(link);
};

const queryResolver: FieldResolver = (
  fieldName,
  rootValue,
  args,
  { store },
  info
) => {
  if (info.isLeaf) {
    return rootValue[fieldName];
  }

  const parentKey = keyOfEntity(rootValue);
  if (parentKey === null) {
    return null;
  }

  const link = store.getLink(keyForLink(parentKey, fieldName, args));
  if (link === null || link === undefined) {
    const fieldValue = rootValue[fieldName];
    return fieldValue !== undefined ? fieldValue : null;
  }

  return entityOfLink(store, link);
};

const isCompleteResolver: FieldResolver = (
  fieldName,
  rootValue,
  args,
  context,
  info
) => {
  const result = queryResolver(fieldName, rootValue, args, context, info);
  if (context.isComplete && !info.isLeaf && result === null) {
    context.isComplete = false;
  }

  return result;
};

const query = (store: Store, request: Request): Result => {
  const context = { isComplete: true, store };
  const response = graphql(
    isCompleteResolver,
    request,
    store.getOrCreateEntity('Query'),
    context
  );

  return {
    dependencies: store.flushTouched(),
    isComplete: context.isComplete,
    response,
  };
};

export default query;
