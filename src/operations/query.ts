import graphql, { ExecInfo } from 'graphql-anywhere';

import Cache from '../cache';
import DepsCache from '../deps';
import { keyForLink, keyOfEntity } from '../keys';
import { CacheResult, Entity, Link, Request } from '../types';

const entityOfLink = (cache: Cache, link: Link) => {
  if (Array.isArray(link)) {
    // @ts-ignore
    return link.map(inner => entityOfLink(cache, inner));
  } else if (link === null || typeof link !== 'string') {
    return null;
  }

  return cache.getEntity(link);
};

const queryResolver = (
  fieldName: string,
  rootValue: Entity,
  args: null | object,
  cache: Cache,
  info: ExecInfo
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
  const depsCache = new DepsCache(cache);
  const response = graphql(
    queryResolver,
    request.query,
    cache.getEntity('Query'),
    depsCache,
    request.variables
  );

  return {
    dependencies: depsCache.getDependencies(),
    response,
  };
};

export default query;
