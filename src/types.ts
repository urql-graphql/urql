import { DocumentNode, FragmentDefinitionNode, SelectionNode } from 'graphql';
import { Store } from './store';

// Helper types
export type NullArray<T> = Array<null | T>;

// GraphQL helper types
export type SelectionSet = ReadonlyArray<SelectionNode>;
export interface Fragments {
  [fragmentName: string]: void | FragmentDefinitionNode;
}

// Scalar types are not entities as part of response data
export type Primitive = null | number | boolean | string;

export interface ScalarObject {
  __typename?: never;
  [key: string]: any;
}

export type Scalar = Primitive | ScalarObject;

export interface SystemFields {
  __typename: string;
  _id?: string | number | null;
  id?: string | number | null;
}

export type EntityField = undefined | Scalar | Scalar[];
export type DataField = Scalar | Scalar[] | Data | NullArray<Data>;

export interface DataFields {
  [fieldName: string]: DataField;
}

export type Data = SystemFields & DataFields;
export type Link<Key = string> = null | Key | NullArray<Key>;
export type ResolvedLink = Link<Data>;

export interface Variables {
  [name: string]: Scalar | Scalar[] | Variables | NullArray<Variables>;
}

// This is an input operation
export interface OperationRequest {
  query: DocumentNode;
  variables?: object;
}

export interface ResolveInfo {
  fragments: Fragments;
  variables: Variables;
}

// Cache resolvers are user-defined to overwrite an entity field result
export type Resolver = (
  parent: Data,
  args: Variables,
  cache: Store,
  info: ResolveInfo
) => DataField;

export interface ResolverConfig {
  [typeName: string]: {
    [fieldName: string]: Resolver;
  };
}

export type UpdateResolver = (
  result: Data,
  args: Variables,
  cache: Store,
  info: ResolveInfo
) => void;

export type KeyGenerator = (data: Data) => null | string;

export interface UpdatesConfig {
  Mutation: {
    [fieldName: string]: UpdateResolver;
  };
  Subscription: {
    [fieldName: string]: UpdateResolver;
  };
}

export type OptimisticMutationResolver = (
  vars: Variables,
  cache: Store,
  info: ResolveInfo
) => null | Data | NullArray<Data>;

export interface OptimisticMutationConfig {
  [mutationFieldName: string]: OptimisticMutationResolver;
}

export interface KeyingConfig {
  [typename: string]: KeyGenerator;
}

// Completeness of the query result
export type Completeness = 'EMPTY' | 'PARTIAL' | 'FULL';
