import { DocumentNode, FragmentDefinitionNode, SelectionNode } from 'graphql';

// Helper types
export type NullArray<T> = Array<null | T>;

export interface Ref<T> {
  current: T;
}

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

export interface Variables {
  [name: string]: Scalar | Scalar[] | Variables | NullArray<Variables>;
}

export type Data = SystemFields & DataFields;
export type Link<Key = string> = null | Key | NullArray<Key>;
export type ResolvedLink = Link<Data>;
export type Connection = [Variables, string];

// This is an input operation
export interface OperationRequest {
  query: DocumentNode;
  variables?: object;
}

export interface ResolveInfo {
  parentTypeName: string;
  parentKey: string;
  parentFieldKey: string;
  fieldName: string;
  fragments: Fragments;
  variables: Variables;
  partial?: boolean;
  optimistic?: boolean;
}

export interface QueryInput {
  query: string | DocumentNode;
  variables?: Variables;
}

export interface Cache {
  /** keyOfEntity() returns the key for an entity or null if it's unkeyable */
  keyOfEntity(data: Data): string | null;

  /** resolve() retrieves the value (or link) of a field on any entity, given a partial/keyable entity or an entity key */
  resolve(
    entity: Data | string | null,
    fieldName: string,
    args?: Variables
  ): DataField;

  /** resolveValueOrLink() returns a field's value on an entity, given that field's key */
  resolveValueOrLink(fieldKey: string): DataField;

  /** resolveConnections() retrieves all known connections (arguments and links) for a given field on an entity */
  resolveConnections(
    entity: Data | string | null,
    fieldName: string
  ): Connection[];

  /** invalidateQuery() invalidates all data of a given query */
  invalidateQuery(query: DocumentNode, variables?: Variables): void;

  /** updateQuery() can be used to update the data of a given query using an updater function */
  updateQuery(
    input: QueryInput,
    updater: (data: Data | null) => Data | null
  ): void;

  /** readQuery() retrieves the data for a given query */
  readQuery(input: QueryInput): Data | null;

  /** readFragment() retrieves the data for a given fragment, given a partial/keyable entity or an entity key */
  readFragment(
    fragment: DocumentNode,
    entity: string | Data,
    variables?: Variables
  ): Data | null;

  /** writeFragment() can be used to update the data of a given fragment, given an entity that is supposed to be written using the fragment */
  writeFragment(
    fragment: DocumentNode,
    data: Data,
    variables?: Variables
  ): void;
}

// Cache resolvers are user-defined to overwrite an entity field result
export type Resolver = (
  parent: Data,
  args: Variables,
  cache: Cache,
  info: ResolveInfo
) => DataField | undefined;

export interface ResolverConfig {
  [typeName: string]: {
    [fieldName: string]: Resolver;
  };
}

export type UpdateResolver = (
  result: Data,
  args: Variables,
  cache: Cache,
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
  cache: Cache,
  info: ResolveInfo
) => null | Data | NullArray<Data>;

export interface OptimisticMutationConfig {
  [mutationFieldName: string]: OptimisticMutationResolver;
}

export interface KeyingConfig {
  [typename: string]: KeyGenerator;
}

export type ErrorCode =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16;
