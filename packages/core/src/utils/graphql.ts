import type * as GraphQLWeb from '@0no-co/graphql.web';
import type * as GraphQL from 'graphql';

type OrNever<T> = 0 extends 1 & T ? never : T;

export type GraphQLError =
  | GraphQLWeb.GraphQLError
  | OrNever<GraphQL.GraphQLError>;

export type DocumentNode =
  | GraphQLWeb.DocumentNode
  | OrNever<GraphQL.DocumentNode>;

export type DefinitionNode =
  | GraphQLWeb.DefinitionNode
  | OrNever<GraphQL.DefinitionNode>;
