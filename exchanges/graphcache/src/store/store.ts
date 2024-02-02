import type { TypedDocumentNode } from '@urql/core';
import { formatDocument, createRequest } from '@urql/core';

import type {
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
  DirectivesConfig,
  Logger,
} from '../types';

import { invariant } from '../helpers/help';
import { contextRef, ensureLink } from '../operations/shared';
import { _query, _queryFragment } from '../operations/query';
import { _write, _writeFragment } from '../operations/write';
import { invalidateEntity, invalidateType } from '../operations/invalidate';
import { keyOfField } from './keys';
import * as InMemoryData from './data';

import type { SchemaIntrospector } from '../ast';
import {
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
  C extends Partial<CacheExchangeOpts> = Partial<CacheExchangeOpts>,
> implements Cache
{
  data: InMemoryData.InMemoryData;

  logger?: Logger;
  directives: DirectivesConfig;
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

    this.logger = opts.logger;
    this.resolvers = opts.resolvers || {};
    this.directives = opts.directives || {};
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
      expectValidKeyingConfig(this.schema, this.keys, this.logger);
      expectValidUpdatesConfig(this.schema, this.updates, this.logger);
      expectValidResolversConfig(this.schema, this.resolvers, this.logger);
      expectValidOptimisticMutationsConfig(
        this.schema,
        this.optimisticMutations,
        this.logger
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

  resolve(
    entity: Entity,
    field: string,
    args?: FieldArgs
  ): DataField | undefined {
    let fieldValue: DataField | undefined = null;
    const entityKey = this.keyOfEntity(entity);
    if (entityKey) {
      const fieldKey = keyOfField(field, args);
      fieldValue = InMemoryData.readRecord(entityKey, fieldKey);
      if (fieldValue === undefined)
        fieldValue = InMemoryData.readLink(entityKey, fieldKey);
    }
    return fieldValue;
  }

  resolveFieldByKey(entity: Entity, field: string, args?: FieldArgs) {
    return this.resolve(entity, field, args);
  }

  invalidate(entity: Entity, field?: string, args?: FieldArgs) {
    const entityKey = this.keyOfEntity(entity);
    const shouldInvalidateType =
      entity &&
      (typeof entity === 'string' || Object.keys(entity).length === 1) &&
      !field &&
      !args;

    if (shouldInvalidateType) {
      invalidateType(typeof entity === 'string' ? entity : entity.__typename);
    } else {
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
    const output = updater(this.readQuery(request));
    if (output !== null) {
      _write(this, request, output as any, undefined);
    }
  }

  readQuery<T = Data, V = Variables>(input: QueryInput<T, V>): T | null {
    const request = createRequest(input.query, input.variables!);
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
    ...rest: [FieldArgs, Link<Entity>] | [Link<Entity>]
  ): void {
    const args = rest.length === 2 ? rest[0] : null;
    const link = rest.length === 2 ? rest[1] : rest[0];
    const entityKey = this.keyOfEntity(entity);
    if (entityKey) {
      InMemoryData.writeLink(
        entityKey,
        keyOfField(field, args),
        ensureLink(this, link)
      );
    }
  }
}
