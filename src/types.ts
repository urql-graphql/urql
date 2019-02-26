import { DocumentNode } from 'graphql';
import { ExecInfo } from 'graphql-anywhere';
import Store from './store';

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

export type EntityMap = Map<string, Entity>;
export type LinkMap = Map<string, Link>;

export interface Context {
  store: Store;
  isComplete?: boolean;
}

export interface Result {
  dependencies: string[];
  isComplete: boolean;
  response?: Entity;
}

export type FieldResolver = (
  fieldName: string,
  rootValue: Entity,
  args: null | object,
  context: Context,
  info: ExecInfo
) => FieldValue;

export type KeyExtractor = (entity: Entity) => void | null | string;
