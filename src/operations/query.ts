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
  store,
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
    return rootValue[fieldName];
  }

  return entityOfLink(store, link);
};

const query = (store: Store, request: Request): Result => {
  const response = graphql(
    queryResolver,
    request,
    store.getEntity('Query'),
    store
  );

  return {
    dependencies: store.flushTouched(),
    response,
  };
};

export default query;
