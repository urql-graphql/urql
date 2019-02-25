import { DocumentNode } from 'graphql';

export interface Request {
  query: DocumentNode;
  variables?: object;
}

export type Scalar = string | number | null;

export interface SystemFields {
  __typename?: string | null;
  _id?: Scalar;
  id?: Scalar;
}

export interface EntityFields {
  [property: string]: Entity | Scalar | Array<Entity | Scalar>;
}

export type Entity = SystemFields & EntityFields;
export type Link = null | string | Array<string | null>;

export interface EntityMap {
  [key: string]: Entity;
}

export interface LinkMap {
  [key: string]: Link;
}

export interface CacheResult {
  dependencies: string[];
  response?: Entity;
}
