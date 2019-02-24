import graphql, { ExecInfo } from 'graphql-anywhere';
import Cache from '../cache';
import { keyForLink, keyOfEntity } from '../keys';

import { Entity, GraphQLRequest, Link } from '../types';

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

const query = (cache: Cache, request: GraphQLRequest): Entity => {
  return graphql(
    queryResolver,
    request.query,
    cache.getEntity('Query'),
    cache,
    request.variables
  );
};

export default query;
