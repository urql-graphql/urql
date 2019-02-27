import Store from '../store';
import { Context, FieldResolver, Request, Result } from '../types';
import { graphql, keyForLink } from '../utils';
import { makeCustomResolver } from './custom';

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

  const entity = store.getEntityFromLink(link);
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
