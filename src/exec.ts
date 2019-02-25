import graphql from 'graphql-anywhere';
import Store from './store';
import { Entity, FieldResolver, Request } from './types';

const typedGraphQL = (
  resolver: FieldResolver,
  { query, variables }: Request,
  root: Entity,
  store: Store
): Entity => {
  return graphql(resolver, query, root, store, variables);
};

export default typedGraphQL;
