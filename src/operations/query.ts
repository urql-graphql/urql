import Store from '../store';
import { Context, FieldResolver, Link, Request, Result } from '../types';
import { graphql, keyForLink } from '../utils';
import { makeCustomResolver } from './custom';

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

  const { store } = context;
  const parentKey = store.keyOfEntity(rootValue);
  if (parentKey === null) {
    context.isComplete = false;
    return null;
  }

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

const resolver = makeCustomResolver(queryResolver);

const query = (store: Store, request: Request): Result => {
  const context: Context = { isComplete: true, store, operation: 'query' };

  const response = graphql(
    resolver,
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
