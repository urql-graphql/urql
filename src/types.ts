import { DocumentNode } from 'graphql';

export interface GraphQLRequest {
  query: DocumentNode;
  variables?: object;
}

export type GqlValue = string | number | null;

export interface SystemFields {
  __typename?: string | null;
  _id?: GqlValue;
  id?: GqlValue;
}

export interface EntityFields {
  [property: string]: Entity | GqlValue | Array<Entity | GqlValue>;
}

export type Entity = SystemFields & EntityFields;
export type Link = null | string | Array<string | null>;

export interface EntityMap {
  [key: string]: Entity;
}

export interface LinkMap {
  [key: string]: Link;
}

export interface Cache {
  records: EntityMap;
  links: LinkMap;
}

export interface Context {
  cache: Cache;
}
