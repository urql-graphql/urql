import { AnyVariables, TypedDocumentNode } from '@urql/core';
import { GraphQLError, DocumentNode, FragmentDefinitionNode } from 'graphql';
import { IntrospectionData } from './ast';

// Helper types
export type NullArray<T> = Array<null | T | NullArray<T>>;

export interface Fragments {
  [fragmentName: string]: void | FragmentDefinitionNode;
}

// Scalar types are not entities as part of response data
export type Primitive = null | number | boolean | string;

export interface ScalarObject {
  constructor?: Function;
  [key: string]: any;
}

export type Scalar = Primitive | ScalarObject;

export interface SystemFields {
  __typename: string;
  _id?: string | number | null;
  id?: string | number | null;
}

export type EntityField = undefined | Scalar | NullArray<Scalar>;
export type DataField = Scalar | Data | NullArray<Scalar> | NullArray<Data>;

export interface DataFields {
  [fieldName: string]: DataField;
}

export interface Variables {
  [name: string]: Scalar | Scalar[] | Variables | NullArray<Variables>;
}

export type Data = SystemFields & DataFields;
export type Entity = null | Data | string;
export type Link<Key = string> = null | Key | NullArray<Key>;
export type Connection = [Variables, string];
export type FieldArgs = Variables | null | undefined;

export interface FieldInfo {
  fieldKey: string;
  fieldName: string;
  arguments: Variables | null;
}

export interface KeyInfo {
  entityKey: string;
  fieldKey: string;
}

// This is an input operation
export interface OperationRequest {
  query: DocumentNode | TypedDocumentNode<any, any>;
  variables?: any;
}

export interface ResolveInfo {
  parent: Data;
  parentTypeName: string;
  parentKey: string;
  parentFieldKey: string;
  fieldName: string;
  fragments: Fragments;
  variables: Variables;
  error: GraphQLError | undefined;
  partial?: boolean;
  optimistic?: boolean;
  __internal?: unknown;
}

export interface QueryInput<T = Data, V = Variables> {
  query: string | DocumentNode | TypedDocumentNode<T, V>;
  variables?: V;
}

export interface Cache {
  /** keyOfEntity() returns the key for an entity or null if it's unkeyable */
  keyOfEntity(entity: Entity): string | null;

  /** keyOfField() returns the key for a field */
  keyOfField(fieldName: string, args?: FieldArgs): string | null;

  /** resolve() retrieves the value (or link) of a field on any entity, given a partial/keyable entity or an entity key */
  resolve(entity: Entity, fieldName: string, args?: FieldArgs): DataField;

  /** @deprecated use resolve() instead */
  resolveFieldByKey(entity: Entity, fieldKey: string): DataField;

  /** inspectFields() retrieves all known fields for a given entity */
  inspectFields(entity: Entity): FieldInfo[];

  /** invalidate() invalidates an entity or a specific field of an entity */
  invalidate(entity: Entity, fieldName?: string, args?: FieldArgs): void;

  /** updateQuery() can be used to update the data of a given query using an updater function */
  updateQuery<T = Data, V = Variables>(
    input: QueryInput<T, V>,
    updater: (data: T | null) => T | null
  ): void;

  /** readQuery() retrieves the data for a given query */
  readQuery<T = Data, V = Variables>(input: QueryInput<T, V>): T | null;

  /** readFragment() retrieves the data for a given fragment, given a partial/keyable entity or an entity key */
  readFragment<T = Data, V = Variables>(
    fragment: DocumentNode | TypedDocumentNode<T, V>,
    entity: string | Data | T,
    variables?: V
  ): T | null;

  /** writeFragment() can be used to update the data of a given fragment, given an entity that is supposed to be written using the fragment */
  writeFragment<T = Data, V = Variables>(
    fragment: DocumentNode | TypedDocumentNode<T, V>,
    data: T,
    variables?: V
  ): void;

  /** link() can be used to update a given entity field to link to another entity or entities */
  link(
    entity: Entity,
    field: string,
    args: FieldArgs,
    link: Link<Entity>
  ): void;
  /** link() can be used to update a given entity field to link to another entity or entities */
  link(entity: Entity, field: string, value: Link<Entity>): void;
}

type ResolverResult =
  | DataField
  | (DataFields & { __typename?: string })
  | null
  | undefined;

/** Input parameters for the {@link cacheExchange}. */
export type CacheExchangeOpts = {
  /** Configures update functions which are called when the mapped fields are written to the cache.
   *
   * @remarks
   * `updates` are commonly used to define additional changes to the cache for
   * mutation or subscription fields. It may commonly be used to invalidate
   * cached data or to modify lists after mutations.
   * This is a map of types to fields to {@link UpdateResolver} functions.
   *
   * @see {@link https://urql.dev/goto/docs/graphcache/cache-updates} for the full updates docs.
   */
  updates?: UpdatesConfig;
  /** Configures resolvers which replace cached reuslts with custom values.
   *
   * @remarks
   * `resolvers` is a map of types to fields to {@link Resolver} functions.
   * These functions allow us to replace cached field values with a custom
   * result, either to replace values on GraphQL results, or to resolve
   * entities from the cache for queries that haven't been sent to the API
   * yet.
   *
   * @see {@link https://urql.dev/goto/docs/graphcache/local-resolvers} for the full resolvers docs.
   */
  resolvers?: ResolverConfig;
  /** Configures optimistic updates to react to mutations instantly before an API response.
   *
   * @remarks
   * `optimistic` is a map of mutation fields to {@link OptimisticMutationResolver} functions.
   * These functions allow us to return result data for mutations to optimistically apply them.
   * Optimistic updates are temporary updates to the cache’s data which allow an app to
   * instantly reflect changes that a mutation will make.
   *
   * @see {@link https://urql.dev/goto/docs/graphcache/cache-updates/#optimistic-updates} for the
   * full optimistic updates docs.
   */
  optimistic?: OptimisticMutationConfig;
  /** Configures keying functions for GraphQL types.
   *
   * @remarks
   * `keys` is a map of GraphQL object type names to {@link KeyGenerator} functions.
   * If a type in your API has no key field or a key field that isn't the default
   * `id` or `_id` fields, you may define a custom key generator for the type.
   *
   * Hint: Graphcache will log warnings when it finds objects that have no keyable
   * fields, which will remind you to define these functions gradually for every
   * type that needs them.
   *
   * @see {@link https://urql.dev/goto/docs/graphcache/normalized-caching/#custom-keys-and-non-keyable-entities} for
   * the full keys docs.
   */
  keys?: KeyingConfig;
  /** Configures Graphcache with Schema Introspection data.
   *
   * @remarks
   * Passing a `schema` to Graphcache enables it to do non-heuristic fragment
   * matching, and be certain when a fragment matches against a union or interface
   * on your schema.
   *
   * It also enables a mode called “Schema Awareness”, which allows Graphcache to
   * return partial GraphQL results, `null`-ing out fields that aren’t in the cache
   * that are nullable on your schema, while requesting the full API response in
   * the background.
   *
   * @see {@link https://urql.dev/goto/urql/docs/graphcache/schema-awareness} for
   * the full keys docs on Schema Awareness.
   */
  schema?: IntrospectionData;
  /** Configures an offline storage adapter for Graphcache.
   *
   * @remarks
   * A {@link StorageAdapter} allows Graphcache to write data to an external,
   * asynchronous storage, and hydrate data from it when it first loads.
   * This allows you to preserve normalized data between restarts/reloads.
   *
   * Hint: If you’re trying to use Graphcache’s Offline Support, you may
   * want to swap out the `cacheExchange` with the {@link offlineExchange}.
   *
   * @see {@link https://urql.dev/goto/docs/graphcache/offline} for the full Offline Support docs.
   */
  storage?: StorageAdapter;
};

// Cache resolvers are user-defined to overwrite an entity field result
export type Resolver<
  ParentData = DataFields,
  Args = Variables,
  Result = ResolverResult
> = {
  bivarianceHack(
    parent: ParentData,
    args: Args,
    cache: Cache,
    info: ResolveInfo
  ): Result;
}['bivarianceHack'];

/** Configures resolvers which replace cached reuslts with custom values.
 *
 * @remarks
 * A `ResolverConfig` is a map of types to fields to {@link Resolver} functions.
 * These functions allow us to replace cached field values with a custom
 * result, either to replace values on GraphQL results, or to resolve
 * entities from the cache for queries that haven't been sent to the API
 * yet.
 *
 * @see {@link https://urql.dev/goto/docs/graphcache/local-resolvers} for the full resolvers docs.
 */
export type ResolverConfig = {
  [typeName: string]: {
    [fieldName: string]: Resolver | void;
  } | void;
};

export type UpdateResolver<ParentData = DataFields, Args = Variables> = {
  bivarianceHack(
    parent: ParentData,
    args: Args,
    cache: Cache,
    info: ResolveInfo
  ): void;
}['bivarianceHack'];

export type KeyGenerator = {
  bivarianceHack(data: Data): string | null;
}['bivarianceHack'];

/** Configures update functions which are called when the mapped fields are written to the cache.
 *
 * @remarks
 * `UpdatesConfig` is a map of types to fields to {@link UpdateResolver} functions.
 * These update functions are defined to instruct the cache to make additional changes
 * when a field is written to the cache.
 *
 * As changes are often made after a mutation or subscription, the `typeName` is
 * often set to `'Mutation'` or `'Subscription'`.
 *
 * @see {@link https://urql.dev/goto/docs/graphcache/cache-updates} for the full updates docs.
 *
 * @example
 * ```ts
 * const updates = {
 *   Mutation: {
 *     deleteAuthor(_parent, args, cache) {
 *       // Delete the Author from the cache when Mutation.deleteAuthor is sent
 *       cache.invalidate({ __typename: 'Author', id: args.id });
 *     },
 *   },
 * };
 */
export type UpdatesConfig = {
  [typeName: string | 'Query' | 'Mutation' | 'Subscription']: {
    [fieldName: string]: UpdateResolver | void;
  } | void;
};

export type MakeFunctional<T> = T extends { __typename: string }
  ? WithTypename<{
      [P in keyof T]?: MakeFunctional<T[P]>;
    }>
  : OptimisticMutationResolver<Variables, T> | T;

export type OptimisticMutationResolver<
  Args = Variables,
  Result = Link<Data> | Scalar
> = {
  bivarianceHack(
    args: Args,
    cache: Cache,
    info: ResolveInfo
  ): MakeFunctional<Result>;
}['bivarianceHack'];

/** Configures optimistic result functions which are called to get a mutation’s optimistic result.
 *
 * @remarks
 * `OptimisticMutationConfig` is a map of mutation fields to {@link OptimisticMutationResolver}
 * functions, which return result data for mutations to optimistically apply them.
 * Optimistic updates are temporary updates to the cache’s data which allow an app to
 * instantly reflect changes that a mutation will make.
 *
 * Hint: Results returned from optimistic functions may be partial, and may contain functions.
 * If the returned optimistic object contains functions on fields, these are executed as nested
 * optimistic resolver functions.
 *
 * @see {@link https://urql.dev/goto/docs/graphcache/cache-updates/#optimistic-updates} for the
 * full optimistic updates docs.
 *
 * @example
 * ```ts
 * const optimistic = {
 *   updateProfile: (args) => ({
 *     __typename: 'UserProfile',
 *     id: args.id,
 *     name: args.newName,
 *   }),
 * };
 */
export type OptimisticMutationConfig = {
  [mutationFieldName: string]: OptimisticMutationResolver;
};

/** Configures keying functions for GraphQL types.
 *
 * @remarks
 * `KeyingConfig` is a map of GraphQL object type names to {@link KeyGenerator} functions.
 * If a type in your API has no key field or a key field that isn't the default
 * `id` or `_id` fields, you may define a custom key generator for the type.
 *
 * Keys are important to a normalized cache, because they’re the identity of the object
 * that is shared across the cache, and helps the cache recognize shared/normalized data.
 *
 * Hint: Graphcache will log warnings when it finds objects that have no keyable
 * fields, which will remind you to define these functions gradually for every
 * type that needs them.
 *
 * @see {@link https://urql.dev/goto/docs/graphcache/normalized-caching/#custom-keys-and-non-keyable-entities} for
 * the full keys docs.
 *
 * @example
 * ```ts
 * const keys = {
 *   Image: data => data.url,
 *   LatLng: () => null,
 * };
 * ```
 */
export type KeyingConfig = {
  [typename: string]: KeyGenerator;
};

/** Serialized normalized caching data. */
export interface SerializedEntries {
  [key: string]: string | undefined;
}

/** A serialized GraphQL request for offline storage. */
export interface SerializedRequest {
  query: string;
  variables: AnyVariables;
}

/** Interface for a storage adapter, used by the {@link offlineExchange} for Offline Support.
 * @see {@link https://urql.dev/goto/docs/graphcache/offline} for the full Offline Support docs.
 * @see `@urql/exchange-graphcache/default-storage` for an example implementation using IndexedDB.
 */
export interface StorageAdapter {
  /** Called to rehydrate data when the {@link cacheExchange} first loads.
   * @remarks
   * `readData` is called when Graphcache first starts up, and loads cache entries
   * using which it'll repopulate its normalized cache data.
   */
  readData(): Promise<SerializedEntries>;
  /** Called by the {@link cacheExchange} to write new data to the offline storage.
   * @remarks
   * `writeData` is called when Graphcache updated its cached data and wishes to
   * persist this data to the offline storage. The data is a partial object and
   * Graphcache does not write all its data at once.
   */
  writeData(delta: SerializedEntries): Promise<any>;
  /** Called to rehydrate metadata when the {@link offlineExchange} first loads.
   * @remarks
   * `readMetadata` is called when Graphcache first starts up, and loads
   * metadata informing it of pending mutations that failed while the device
   * was offline.
   */
  readMetadata?(): Promise<null | SerializedRequest[]>;
  /** Called by the {@link offlineExchange} to persist failed mutations.
   * @remarks
   * `writeMetadata` is called when a mutation failed to persist a queue
   * of failed mutations to the offline storage that must be retried when
   * the application is reloaded.
   */
  writeMetadata?(json: SerializedRequest[]): void;
  /** Called to register a callback called when the device is back online.
   * @remarks
   * `onOnline` is called by the {@link offlineExchange} with a callback.
   * This callback must be called when the device comes back online and
   * will cause all failed mutations in the queue to be retried.
   */
  onOnline?(cb: () => void): any;
}

export type Dependencies = Set<string>;

/** The type of cache operation being executed. */
export type OperationType = 'read' | 'write';

export type WithTypename<T extends { __typename?: any }> = T & {
  __typename: NonNullable<T['__typename']>;
};
