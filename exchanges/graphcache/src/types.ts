import { AnyVariables, TypedDocumentNode } from '@urql/core';
import { GraphQLError, DocumentNode, FragmentDefinitionNode } from 'graphql';
import { IntrospectionData } from './ast';

/** Nullable GraphQL list types of `T`.
 *
 * @remarks
 * Any GraphQL list of a given type `T` that is nullable is
 * expected to contain nullable values. Nested lists are
 * also taken into account in Graphcache.
 */
export type NullArray<T> = Array<null | T | NullArray<T>>;

/** Dictionary of GraphQL Fragment definitions by their names.
 *
 * @remarks
 * A map of {@link FragmentDefinitionNode | FragmentDefinitionNodes} by their
 * fragment names from the original GraphQL document that Graphcache is
 * executing.
 */
export interface Fragments {
  [fragmentName: string]: void | FragmentDefinitionNode;
}

/** Non-object JSON values as serialized by a GraphQL API
 * @see {@link https://spec.graphql.org/October2021/#sel-DAPJDHAAEJHAKmzP} for the
 * GraphQL spec’s serialization format.
 */
export type Primitive = null | number | boolean | string;

/** Any GraphQL scalar object
 *
 * @remarks
 * A GraphQL schema may define custom scalars that are resolved
 * and serialized as objects. These objects could also be turned
 * on the client-side into a non-JSON object, e.g. a `Date`.
 *
 * @see {@link https://spec.graphql.org/October2021/#sec-Scalars} for the
 * GraphQL spec’s information on custom scalars.
 */
export interface ScalarObject {
  constructor?: Function;
  [key: string]: any;
}

/** GraphQL scalar value
 * @see {@link https://spec.graphql.org/October2021/#sec-Scalars} for the GraphQL
 * spec’s definition of scalars
 */
export type Scalar = Primitive | ScalarObject;

/** Fields that Graphcache expects on GraphQL object (“entity”) results.
 *
 * @remarks
 * Any object that comes back from a GraphQL API will have
 * a `__typename` field from GraphQL Object types.
 *
 * The `__typename` field must be present as Graphcache updates
 * GraphQL queries with type name introspection.
 * Furthermore, Graphcache always checks for its default key
 * fields, `id` and `_id` to be present.
 */
export interface SystemFields {
  /** GraphQL Object type name as returned by Type Name Introspection.
   * @see {@link https://spec.graphql.org/October2021/#sec-Type-Name-Introspection} for
   * more information on GraphQL’s Type Name introspection.
   */
  __typename: string;
  _id?: string | number | null;
  id?: string | number | null;
}

/** Scalar values are stored separately from relations between entities.
 * @internal
 */
export type EntityField = undefined | Scalar | NullArray<Scalar>;

/** Values on GraphQL object (“entity”) results.
 *
 * @remarks
 * Any field that comes back from a GraphQL API will have
 * values that are scalars, other objects, or arrays
 * of scalars or objects.
 */
export type DataField = Scalar | Data | NullArray<Scalar> | NullArray<Data>;

/** Definition of GraphQL object (“entity”) fields.
 *
 * @remarks
 * Any object that comes back from a GraphQL API will have
 * values that are scalars, other objects, or arrays
 * of scalars or objects, i.e. the {@link DataField} type.
 */
export interface DataFields {
  [fieldName: string]: DataField;
}

/** Definition of GraphQL variables objects.
 * @remarks
 * Variables, as passed to GraphQL queries, can only contain scalar values.
 *
 * @see {@link https://spec.graphql.org/October2021/#sec-Coercing-Variable-Values} for the
 * GraphQL spec’s coercion of GraphQL variables.
 */
export interface Variables {
  [name: string]: Scalar | Scalar[] | Variables | NullArray<Variables>;
}

/** Definition of GraphQL objects (“entities”).
 *
 * @remarks
 * An entity is expected to consist of a `__typename`
 * fields, optionally the default `id` or `_id` key
 * fields, and scalar values or other entities
 * otherwise.
 */
export type Data = SystemFields & DataFields;

/** An entity, a key of an entity, or `null`
 *
 * @remarks
 * When Graphcache accepts a reference to an entity, you may pass it a key of an entity,
 * as retrieved for instance by {@link Cache.keyOfEntity} or a partial GraphQL object
 * (i.e. an object with a `__typename` and key field).
 */
export type Entity = null | Data | string;

/** A key of an entity, or `null`; or a list of keys.
 *
 * @remarks
 * When Graphcache accepts a reference to one or more entities, you may pass it a
 * key, an entity, or a list of entities or keys. This is often passed to {@link Cache.link}
 * to update a field pointing to other GraphQL objects.
 */
export type Link<Key = string> = null | Key | NullArray<Key>;

/** Arguments passed to a Graphcache field resolver.
 *
 * @remarks
 * Arguments a field receives are similar to variables and can
 * only contain scalars or other arguments objects. This
 * is equivalent to the {@link Variables} type.
 *
 * @see {@link https://spec.graphql.org/October2021/#sec-Coercing-Field-Arguments} for the
 * GraphQL spec’s coercion of field arguments.
 */
export type FieldArgs = Variables | null | undefined;

/** Metadata about an entity’s cached field.
 *
 * @remarks
 * As returned by {@link Cache.inspectFields}, `FieldInfo` specifies an entity’s cached field,
 * split into the field’s key itself and the field’s original name and arguments.
 */
export interface FieldInfo {
  /** The field’s key which combines `fieldName` and `arguments`. */
  fieldKey: string;
  /** The field’s name, as defined on a GraphQL Object type. */
  fieldName: string;
  /** The arguments passed to the field as found on the cache. */
  arguments: Variables | null;
}

/** A key to an entity field split back into the entity’s key and the field’s key part.
 * @internal
 */
export interface KeyInfo {
  entityKey: string;
  fieldKey: string;
}

/** Abstract type for GraphQL requests.
 *
 * @remarks
 * Similarly to `@urql/core`’s `GraphQLRequest` type, `OperationRequest`
 * requires the minimum fields that Grapcache requires to execute a
 * GraphQL operation: its query document and variables.
 */
export interface OperationRequest {
  query: DocumentNode | TypedDocumentNode<any, any>;
  variables?: any;
}

/** Metadata object passed to all resolver functions.
 *
 * @remarks
 * `ResolveInfo`, similar to GraphQL.js’ `GraphQLResolveInfo` object,
 * gives your resolvers a global state of the current GraphQL
 * document traversal.
 *
 * `parent`, `parenTypeName`, `parentKey`, and `parentFieldKey`
 * are particularly useful to make reusable resolver functions that
 * must know on which field and type they’re being called on.
 */
export interface ResolveInfo {
  /** The parent GraphQL object.
   *
   * @remarks
   * The GraphQL object that the resolver has been called on. Because this is
   * a reference to raw GraphQL data, this may be incomplete or contain
   * aliased fields!
   */
  parent: Data;
  /** The parent object’s typename that the resolver has been called on. */
  parentTypeName: string;
  /** The parent object’s entity key that the resolver has been called on. */
  parentKey: string;
  /** Current field’s key that the resolver has been called on. */
  parentFieldKey: string;
  /** Current field that the resolver has been called on. */
  fieldName: string;
  /** Map of fragment definitions from the {@link DocumentNode}. */
  fragments: Fragments;
  /** Full original {@link Variables} object on the {@link OperationRequest}. */
  variables: Variables;
  /** Error that occurred for the current field, if any.
   *
   * @remarks
   * If a {@link GraphQLError.path} points at the current field, the error
   * will be set and provided here. This can be useful to recover from an
   * error on a specific field.
   */
  error: GraphQLError | undefined;
  /** Flag used to indicate whether the current GraphQL query is only partially cached.
   *
   * @remarks
   * When Graphcache has {@link CacheExchangeOpts.schema} introspection information,
   * it can automatically generate partial results and trigger a full API request
   * in the background.
   * Hence, this field indicates whether any data so far has only been partially
   * resolved from the cache, and is only in use on {@link Resolver | Resolvers}.
   *
   * However, you can also flip this flag to `true` manually to indicate to
   * the {@link cacheExchange} that it should still make a network request.
   */
  partial?: boolean;
  /** Flag used to indicate whether the current GraphQL mutation is optimistically executed.
   *
   * @remarks
   * An {@link UpdateResolver} is called for both API mutation responses and
   * optimistic mutation reuslts, as generated by {@link OptimisticMutationResolver}.
   *
   * Since an update sometimes needs to perform different actions if it’s run
   * optimistically, this flag is set to `true` during optimisti cupdates.
   */
  optimistic?: boolean;
  /** Internal state used by Graphcache.
   * @internal
   */
  __internal?: unknown;
}

/** GraphQL document and variables that should be queried against the cache.
 *
 * @remarks
 * `QueryInput` is a generic GraphQL request that should be executed against
 * cached data, as accepted by {@link cache.readQuery}.
 */
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

/** Values a {@link Resolver} may return.
 *
 * @remarks
 * A resolver may return any value that a GraphQL object may contain.
 *
 * Additionally however, a resolver may return `undefined` to indicate that data
 * isn’t available from the cache, i.e. to trigger a cache miss.
 */
export type ResolverResult =
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

/** Remaps result type to allow for nested optimistic mutation resolvers.
 *
 * @remarks
 * An {@link OptimisticMutationResolver} can not only return partial, nested
 * mutation result data, but may also contain more optimistic mutation resolvers
 * for nested fields, which allows fields with arguments to optimistically be
 * resolved to dynamic values.
 *
 * @see {@link OptimisticMutationConfig} for more information.
 */
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

/** Set of keys that have been modified or accessed.
 * @internal
 */
export type Dependencies = Set<string>;

/** The type of cache operation being executed.
 * @internal
 */
export type OperationType = 'read' | 'write';

/** Casts a given object type to have a required typename field.
 * @internal
 */
export type WithTypename<T extends { __typename?: any }> = T & {
  __typename: NonNullable<T['__typename']>;
};
