import graphql from 'graphql-anywhere';
import { Context, Entity, FieldResolver, Request } from './types';

const typedGraphQL = (
  resolver: FieldResolver,
  { query, variables }: Request,
  root: Entity,
  context: Context
): Entity => {
  return graphql(resolver, query, root, context, variables);
};

export default typedGraphQL;
