import {
  buildClientSchema,
  DocumentNode,
  IntrospectionQuery,
  GraphQLSchema,
} from 'graphql';

import { TypedDocumentNode, formatDocument, createRequest } from '@urql/core';

import {
  Cache,
  FieldInfo,
  ResolverConfig,
  DataField,
  Variables,
  Data,
  QueryInput,
  UpdatesConfig,
  UpdateResolver,
  OptimisticMutationConfig,
  KeyingConfig,
} from '../types';

import { invariant } from '../helpers/help';
import { read, readFragment } from '../operations/query';
import { writeFragment, startWrite } from '../operations/write';
import { invalidateEntity } from '../operations/invalidate';
import { keyOfField } from './keys';
import * as InMemoryData from './data';
import * as SchemaPredicates from '../ast/schemaPredicates';

type RootField = 'query' | 'mutation' | 'subscription';

export interface StoreOpts {
  updates?: Partial<UpdatesConfig>;
  resolvers?: ResolverConfig;
  optimistic?: OptimisticMutationConfig;
  keys?: KeyingConfig;
  schema?: IntrospectionQuery;
}

export class Store implements Cache {
  data: InMemoryData.InMemoryData;

  resolvers: ResolverConfig;
  updates: Record<string, Record<string, UpdateResolver>>;
  optimisticMutations: OptimisticMutationConfig;
  keys: KeyingConfig;
  schema?: GraphQLSchema;

  rootFields: { query: string; mutation: string; subscription: string };
  rootNames: { [name: string]: RootField };

  constructor(opts?: StoreOpts) {
    if (!opts) opts = {};

    this.resolvers = opts.resolvers || {};
    this.optimisticMutations = opts.optimistic || {};
    this.keys = opts.keys || {};

    let queryName = 'Query';
    let mutationName = 'Mutation';
    let subscriptionName = 'Subscription';
    if (opts.schema) {
      const schema = (this.schema = buildClientSchema(opts.schema));
      const queryType = schema.getQueryType();
      const mutationType = schema.getMutationType();
      const subscriptionType = schema.getSubscriptionType();
      queryName = queryType ? queryType.name : queryName;
      mutationName = mutationType ? mutationType.name : mutationName;
      subscriptionName = subscriptionType
        ? subscriptionType.name
        : subscriptionName;
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
      SchemaPredicates.expectValidKeyingConfig(this.schema, this.keys);
      SchemaPredicates.expectValidUpdatesConfig(this.schema, this.updates);
      SchemaPredicates.expectValidResolversConfig(this.schema, this.resolvers);
      SchemaPredicates.expectValidOptimisticMutationsConfig(
        this.schema,
        this.optimisticMutations
      );
    }
  }

  keyOfField = keyOfField;

  keyOfEntity(data: Data) {
    const { __typename: typename, id, _id } = data;
    if (!typename) {
      return null;
    } else if (this.rootNames[typename] !== undefined) {
      return typename;
    }

    let key: string | null | void;
    if (this.keys[typename]) {
      key = this.keys[typename](data);
    } else if (id !== undefined && id !== null) {
      key = `${id}`;
    } else if (_id !== undefined && _id !== null) {
      key = `${_id}`;
    }

    return key ? `${typename}:${key}` : null;
  }

  resolveFieldByKey(entity: Data | string | null, fieldKey: string): DataField {
    const entityKey =
      entity !== null && typeof entity !== 'string'
        ? this.keyOfEntity(entity)
        : entity;
    if (entityKey === null) return null;
    const fieldValue = InMemoryData.readRecord(entityKey, fieldKey);
    if (fieldValue !== undefined) return fieldValue;
    const link = InMemoryData.readLink(entityKey, fieldKey);
    return link ? link : null;
  }

  resolve(
    entity: Data | string | null,
    field: string,
    args?: Variables
  ): DataField {
    return this.resolveFieldByKey(entity, keyOfField(field, args));
  }

  invalidate(entity: Data | string, field?: string, args?: Variables) {
    const entityKey =
      typeof entity === 'string' ? entity : this.keyOfEntity(entity);

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

    invalidateEntity(entityKey, field, args);
  }

  inspectFields(entity: Data | string | null): FieldInfo[] {
    const entityKey =
      entity !== null && typeof entity !== 'string'
        ? this.keyOfEntity(entity)
        : entity;

    return entityKey !== null ? InMemoryData.inspectFields(entityKey) : [];
  }

  updateQuery<T = Data, V = Variables>(
    input: QueryInput<T, V>,
    updater: (data: T | null) => T | null
  ): void {
    const request = createRequest<T, V>(input.query, input.variables as any);
    request.query = formatDocument(request.query);
    const output = updater(this.readQuery(request));
    if (output !== null) {
      startWrite(this, request, output as any);
    }
  }

  readQuery<T = Data, V = Variables>(input: QueryInput<T, V>): T | null {
    const request = createRequest(input.query, input.variables!);
    request.query = formatDocument(request.query);
    return read(this, request).data as T | null;
  }

  readFragment<T = Data, V = Variables>(
    fragment: DocumentNode | TypedDocumentNode<T, V>,
    entity: string | Data | T,
    variables?: V
  ): T | null {
    return readFragment(
      this,
      formatDocument(fragment),
      entity,
      variables as any
    ) as T | null;
  }

  writeFragment<T = Data, V = Variables>(
    fragment: DocumentNode | TypedDocumentNode<T, V>,
    data: T,
    variables?: V
  ): void {
    writeFragment(this, formatDocument(fragment), data, variables as any);
  }
}
