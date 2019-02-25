import graphql from 'graphql-anywhere';
import Cache from './cache';
import { Entity, FieldResolver, Request } from './types';

const typedGraphQL = (
  resolver: FieldResolver,
  { query, variables }: Request,
  root: Entity,
  cache: Cache
): Entity => {
  return graphql(resolver, query, root, cache, variables);
};

export default typedGraphQL;
