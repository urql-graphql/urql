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
  context,
  info
) => {
  if (info.isLeaf) {
    return rootValue[fieldName];
  }

  const parentKey = keyOfEntity(rootValue);
  if (parentKey === null) {
    context.isComplete = false;
    return null;
  }

  const { store } = context;
  const link = store.getLink(keyForLink(parentKey, fieldName, args));
  if (link === null || link === undefined) {
    const fieldValue = rootValue[fieldName];
    if (fieldValue === undefined) {
      context.isComplete = false;
      return null;
    }

    return fieldValue;
  }

  const entity = entityOfLink(store, link);
  if (entity === null) {
    context.isComplete = false;
  }

  return entity;
};

const query = (store: Store, request: Request): Result => {
  const context = { isComplete: true, store };
  const response = graphql(
    queryResolver,
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
