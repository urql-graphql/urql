import graphqlAnywhere from 'graphql-anywhere';
import { Context, Entity, FieldResolver, Request } from '../types';

export const graphql = (
  resolver: FieldResolver,
  { query, variables }: Request,
  root: Entity,
  context: Context
): Entity => {
  return graphqlAnywhere(resolver, query, root, context, variables);
};
