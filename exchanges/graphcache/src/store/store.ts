import { DocumentNode } from 'graphql';
import {
  TypedDocumentNode,
  formatDocument,
  createRequest,
  Client,
  RequestPolicy,
  Operation,
} from '@urql/core';

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
  UpdateResolver,
  OptimisticMutationConfig,
  KeyingConfig,
  Entity,
  CacheExchangeOpts,
  OperationType,
} from '../types';

import { toRequestPolicy } from '../helpers/operation';
import { invariant } from '../helpers/help';
import { contextRef, ensureLink } from '../operations/shared';
import { read, readFragment } from '../operations/query';
import { writeFragment, startWrite } from '../operations/write';
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
import {
  clearDataState,
  getCurrentDependencies,
  getCurrentOperation,
  initDataState,
} from './data';
import { makeDict } from '../helpers/dict';

type RootField = 'query' | 'mutation' | 'subscription';
type DependentOperations = Record<string, number[]>;
type Operations = Set<number>;
type OperationMap = Map<number, Operation>;

export class Store<
  C extends Partial<CacheExchangeOpts> = Partial<CacheExchangeOpts>
> implements Cache {
  data: InMemoryData.InMemoryData;
  client?: Client;
  deps: DependentOperations = makeDict();
  requestedRefetch: Operations = new Set();
  operations: OperationMap = new Map();

  resolvers: ResolverConfig;
  updates: Record<string, Record<string, UpdateResolver | undefined>>;
  optimisticMutations: OptimisticMutationConfig;
  keys: KeyingConfig;
  schema?: SchemaIntrospector;

  rootFields: { query: string; mutation: string; subscription: string };
  rootNames: { [name: string]: RootField };

  constructor(opts?: C) {
    if (!opts) opts = {} as C;

    this.resolvers = opts.resolvers || {};
    this.optimisticMutations = opts.optimistic || {};
    this.keys = opts.keys || {};

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

    this.updates = {
      [mutationName]: (opts.updates && opts.updates.Mutation) || {},
      [subscriptionName]: (opts.updates && opts.updates.Subscription) || {},
    };

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

  keyOfField = keyOfField;

  keyOfEntity(data: Entity) {
    // In resolvers and updaters we may have a specific parent
    // object available that can be used to skip to a specific parent
    // key directly without looking at its incomplete properties
    if (contextRef.current && data === contextRef.current.parent)
      return contextRef.current!.parentKey;

    if (data == null || typeof data === 'string') return data || null;
    if (!data.__typename) return null;
    if (this.rootNames[data.__typename]) return data.__typename;

    let key: string | null | void;
    if (this.keys[data.__typename]) {
      key = this.keys[data.__typename](data);
    } else if (data.id != null) {
      key = `${data.id}`;
    } else if (data._id != null) {
      key = `${data._id}`;
    }

    return key ? `${data.__typename}:${key}` : null;
  }

  prepareCache(type: OperationType): null | (() => void) {
    const op = getCurrentOperation();
    if (!op) {
      initDataState(type, this.data);
      return () => {
        if (type === 'write') {
          const deps = getCurrentDependencies();
          const pendingOperations: Set<number> = new Set();

          if (deps) {
            // Collect operations that will be updated due to cache changes
            for (const dep in deps) {
              const keys = this.deps[dep];
              if (keys) {
                this.deps[dep] = [];
                for (let i = 0, l = keys.length; i < l; i++) {
                  pendingOperations.add(keys[i]);
                }
              }
            }
          }

          pendingOperations.forEach(key => {
            const op = this.operations.get(key);
            if (op) {
              this.operations.delete(key);
              let policy: RequestPolicy = 'cache-first';
              if (this.requestedRefetch.has(key)) {
                this.requestedRefetch.delete(key);
                policy = 'cache-and-network';
              }
              this.client!.reexecuteOperation(toRequestPolicy(op, policy));
            }
          });
        }
        clearDataState();
      };
    }

    return null;
  }

  resolve(entity: Entity, field: string, args?: FieldArgs): DataField {
    const cleanup = this.prepareCache('read');

    const fieldKey = keyOfField(field, args);
    const entityKey = this.keyOfEntity(entity);
    if (!entityKey) return null;
    const fieldValue = InMemoryData.readRecord(entityKey, fieldKey);

    if (fieldValue !== undefined) {
      if (cleanup) cleanup();
      return fieldValue;
    }

    const link = InMemoryData.readLink(entityKey, fieldKey);
    if (cleanup) cleanup();
    return link || null;
  }

  resolveFieldByKey = this.resolve;

  invalidate(entity: Entity, field?: string, args?: FieldArgs) {
    const entityKey = this.keyOfEntity(entity);

    invariant(
      entityKey,
      "Can't generate a key for invalidate(...).\n" +
        'You have to pass an id or _id field or create a custom `keys` field for `' +
        typeof entity ===
        'object'
        ? (entity as Data).__typename
        : entity + '`.',
      19
    );

    const cleanup = this.prepareCache('write');
    invalidateEntity(entityKey, field, args);
    if (cleanup) cleanup();
  }

  inspectFields(entity: Entity): FieldInfo[] {
    const entityKey = this.keyOfEntity(entity);
    if (entityKey) {
      const cleanup = this.prepareCache('read');
      const result = InMemoryData.inspectFields(entityKey);
      if (cleanup) cleanup();
      return result;
    }
    return [];
  }

  updateQuery<T = Data, V = Variables>(
    input: QueryInput<T, V>,
    updater: (data: T | null) => T | null
  ): void {
    const request = createRequest<T, V>(input.query, input.variables as any);
    request.query = formatDocument(request.query);
    const output = updater(this.readQuery(request));
    if (output !== null) {
      const cleanup = this.prepareCache('write');
      startWrite(this, request, output as any);
      if (cleanup) cleanup();
    }
  }

  readQuery<T = Data, V = Variables>(input: QueryInput<T, V>): T | null {
    const cleanup = this.prepareCache('read');
    const request = createRequest(input.query, input.variables!);
    request.query = formatDocument(request.query);
    const result = read(this, request).data as T | null;
    if (cleanup) cleanup();
    return result;
  }

  readFragment<T = Data, V = Variables>(
    fragment: DocumentNode | TypedDocumentNode<T, V>,
    entity: string | Data | T,
    variables?: V
  ): T | null {
    const cleanup = this.prepareCache('read');
    const result = readFragment(
      this,
      formatDocument(fragment),
      entity,
      variables as any
    ) as T | null;
    if (cleanup) cleanup();
    return result;
  }

  writeFragment<T = Data, V = Variables>(
    fragment: DocumentNode | TypedDocumentNode<T, V>,
    data: T,
    variables?: V
  ): void {
    const cleanup = this.prepareCache('write');
    writeFragment(this, formatDocument(fragment), data, variables as any);
    if (cleanup) cleanup();
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
    const link = (maybeLink !== undefined
      ? maybeLink
      : argsOrLink) as Link<Entity>;
    const entityKey = ensureLink(this, entity);
    if (typeof entityKey === 'string') {
      const cleanup = this.prepareCache('write');
      InMemoryData.writeLink(
        entityKey,
        keyOfField(field, args),
        ensureLink(this, link)
      );
      if (cleanup) cleanup();
    }
  }
}
