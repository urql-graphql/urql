import { DocumentNode } from 'graphql';
import { ExecInfo } from 'graphql-anywhere';
import Cache from './cache';

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

export type FieldValue = Entity | Scalar | Array<Entity | Scalar>;

export interface EntityFields {
  [property: string]: FieldValue;
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

export type FieldResolver = (
  fieldName: string,
  rootValue: Entity,
  args: null | object,
  cache: Cache,
  info: ExecInfo
) => FieldValue;
