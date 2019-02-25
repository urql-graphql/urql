import Cache from '../cache';
import graphql from '../exec';
import { keyForLink, keyOfEntity } from '../keys';
import { CacheResult, FieldResolver, Link, Request } from '../types';

const entityOfLink = (cache: Cache, link: Link) => {
  if (Array.isArray(link)) {
    // @ts-ignore
    return link.map(inner => entityOfLink(cache, inner));
  } else if (link === null || typeof link !== 'string') {
    return null;
  }

  return cache.getEntity(link);
};

const queryResolver: FieldResolver = (
  fieldName,
  rootValue,
  args,
  cache,
  info
) => {
  if (info.isLeaf) {
    return rootValue[fieldName];
  }

  const parentKey = keyOfEntity(rootValue);
  if (parentKey === null) {
    return null;
  }

  const link = cache.getLink(keyForLink(parentKey, fieldName, args));
  if (link === null || link === undefined) {
    return rootValue[fieldName];
  }

  return entityOfLink(cache, link);
};

const query = (cache: Cache, request: Request): CacheResult => {
  const response = graphql(
    queryResolver,
    request,
    cache.getEntity('Query'),
    cache
  );

  return {
    dependencies: cache.flushTouched(),
    response,
  };
};

export default query;
