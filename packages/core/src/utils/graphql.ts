import type * as GraphQLWeb from '@0no-co/graphql.web';
import type * as GraphQL from 'graphql';

type OrNever<T> = void extends T ? never : T;

export type GraphQLError =
  | GraphQLWeb.GraphQLError
  | OrNever<GraphQL.GraphQLError>;

export type DocumentNode =
  | GraphQLWeb.DocumentNode
  | OrNever<GraphQL.DocumentNode>;

export type DefinitionNode =
  | GraphQLWeb.DefinitionNode
  | OrNever<GraphQL.DefinitionNode>;
