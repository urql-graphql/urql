import { TypedDocumentNode, formatDocument, createRequest } from '@urql/core';

import {
  Cache,
  FieldInfo,
  ResolverConfig,
  DataField,
  Variables,
  FieldArgs,
  Link,
  Data,
  QueryInput,
  UpdatesConfig,
  OptimisticMutationConfig,
  KeyingConfig,
  Entity,
  CacheExchangeOpts,
} from '../types';

import { invariant } from '../helpers/help';
import { contextRef, ensureLink } from '../operations/shared';
import { _query, _queryFragment } from '../operations/query';
import { _write, _writeFragment } from '../operations/write';
import { invalidateEntity } from '../operations/invalidate';
import { keyOfField } from './keys';
import * as InMemoryData from './data';

import {
  SchemaIntrospector,
  buildClientSchema,
  expectValidKeyingConfig,
  expectValidUpdatesConfig,
  expectValidResolversConfig,
  expectValidOptimisticMutationsConfig,
} from '../ast';

type DocumentNode = TypedDocumentNode<any, any>;
type RootField = 'query' | 'mutation' | 'subscription';

/** Implementation of the {@link Cache} interface as created internally by the {@link cacheExchange}.
 * @internal
 */
export class Store<
  C extends Partial<CacheExchangeOpts> = Partial<CacheExchangeOpts>
> implements Cache
{
  data: InMemoryData.InMemoryData;

  resolvers: ResolverConfig;
  updates: UpdatesConfig;
  optimisticMutations: OptimisticMutationConfig;
  keys: KeyingConfig;
  globalIDs: Set<string> | boolean;
  schema?: SchemaIntrospector;

  rootFields: { query: string; mutation: string; subscription: string };
  rootNames: { [name: string]: RootField | void };

  constructor(opts?: C) {
    if (!opts) opts = {} as C;

    this.resolvers = opts.resolvers || {};
    this.optimisticMutations = opts.optimistic || {};
    this.keys = opts.keys || {};

    this.globalIDs = Array.isArray(opts.globalIDs)
      ? new Set(opts.globalIDs)
      : !!opts.globalIDs;

    let queryName = 'Query';
    let mutationName = 'Mutation';
    let subscriptionName = 'Subscription';
    if (opts.schema) {
      const schema = buildClientSchema(opts.schema);
      queryName = schema.query || queryName;
      mutationName = schema.mutation || mutationName;
      subscriptionName = schema.subscription || subscriptionName;
      // Only add schema introspector if it has types info
      if (schema.types) this.schema = schema;
    }

    this.updates = opts.updates || {};

    this.rootFields = {
      query: queryName,
      mutation: mutationName,
      subscription: subscriptionName,
    };

    this.rootNames = {
      [queryName]: 'query',
      [mutationName]: 'mutation',
      [subscriptionName]: 'subscription',
    };

    this.data = InMemoryData.make(queryName);

    if (this.schema && process.env.NODE_ENV !== 'production') {
      expectValidKeyingConfig(this.schema, this.keys);
      expectValidUpdatesConfig(this.schema, this.updates);
      expectValidResolversConfig(this.schema, this.resolvers);
      expectValidOptimisticMutationsConfig(
        this.schema,
        this.optimisticMutations
      );
    }
  }

  keyOfField(fieldName: string, fieldArgs?: FieldArgs) {
    return keyOfField(fieldName, fieldArgs);
  }

  keyOfEntity(data: Entity) {
    // In resolvers and updaters we may have a specific parent
    // object available that can be used to skip to a specific parent
    // key directly without looking at its incomplete properties
    if (contextRef && data === contextRef.parent) {
      return contextRef.parentKey;
    } else if (data == null || typeof data === 'string') {
      return data || null;
    } else if (!data.__typename) {
      return null;
    } else if (this.rootNames[data.__typename]) {
      return data.__typename;
    }

    let key: string | null = null;
    if (this.keys[data.__typename]) {
      key = this.keys[data.__typename](data) || null;
    } else if (data.id != null) {
      key = `${data.id}`;
    } else if (data._id != null) {
      key = `${data._id}`;
    }

    const typename = data.__typename;
    const globalID =
      this.globalIDs === true ||
      (this.globalIDs && this.globalIDs.has(typename));
    return globalID || !key ? key : `${typename}:${key}`;
  }

  resolve(entity: Entity, field: string, args?: FieldArgs): DataField {
    const fieldKey = keyOfField(field, args);
    const entityKey = this.keyOfEntity(entity);
    if (!entityKey) return null;
    const fieldValue = InMemoryData.readRecord(entityKey, fieldKey);
    if (fieldValue !== undefined) return fieldValue;
    const link = InMemoryData.readLink(entityKey, fieldKey);
    return link || null;
  }

  resolveFieldByKey(entity: Entity, field: string, args?: FieldArgs) {
    return this.resolve(entity, field, args);
  }

  invalidate(entity: Entity, field?: string, args?: FieldArgs) {
    const entityKey = this.keyOfEntity(entity);

    invariant(
      entityKey,
      "Can't generate a key for invalidate(...).\n" +
        'You have to pass an id or _id field or create a custom `keys` field for `' +
        (typeof entity === 'object'
          ? (entity as Data).__typename
          : entity + '`.'),
      19
    );

    invalidateEntity(entityKey, field, args);
  }

  inspectFields(entity: Entity): FieldInfo[] {
    const entityKey = this.keyOfEntity(entity);
    return entityKey ? InMemoryData.inspectFields(entityKey) : [];
  }

  updateQuery<T = Data, V = Variables>(
    input: QueryInput<T, V>,
    updater: (data: T | null) => T | null
  ): void {
    const request = createRequest(input.query, input.variables!);
    request.query = formatDocument(request.query);
    const output = updater(this.readQuery(request));
    if (output !== null) {
      _write(this, request, output as any, undefined);
    }
  }

  readQuery<T = Data, V = Variables>(input: QueryInput<T, V>): T | null {
    const request = createRequest(input.query, input.variables!);
    request.query = formatDocument(request.query);
    return _query(this, request, undefined, undefined).data as T | null;
  }

  readFragment<T = Data, V = Variables>(
    fragment: DocumentNode | TypedDocumentNode<T, V>,
    entity: string | Data | T,
    variables?: V,
    fragmentName?: string
  ): T | null {
    return _queryFragment(
      this,
      formatDocument(fragment),
      entity as Data,
      variables as any,
      fragmentName
    ) as T | null;
  }

  writeFragment<T = Data, V = Variables>(
    fragment: DocumentNode | TypedDocumentNode<T, V>,
    data: T,
    variables?: V,
    fragmentName?: string
  ): void {
    _writeFragment(
      this,
      formatDocument(fragment),
      data as Data,
      variables as any,
      fragmentName
    );
  }

  link(
    entity: Entity,
    field: string,
    args: FieldArgs,
    link: Link<Entity>
  ): void;

  link(entity: Entity, field: string, link: Link<Entity>): void;

  link(
    entity: Entity,
    field: string,
    argsOrLink: FieldArgs | Link<Entity>,
    maybeLink?: Link<Entity>
  ): void {
    const args = (maybeLink !== undefined ? argsOrLink : null) as FieldArgs;
    const link = (
      maybeLink !== undefined ? maybeLink : argsOrLink
    ) as Link<Entity>;
    const entityKey = ensureLink(this, entity);
    if (typeof entityKey === 'string') {
      InMemoryData.writeLink(
        entityKey,
        keyOfField(field, args),
        ensureLink(this, link)
      );
    }
  }
}
