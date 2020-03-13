import {
  buildClientSchema,
  DocumentNode,
  IntrospectionQuery,
  GraphQLSchema,
} from 'graphql';

import { createRequest } from '@urql/core';

import {
  Cache,
  FieldInfo,
  ResolverConfig,
  DataField,
  Variables,
  Data,
  QueryInput,
  UpdatesConfig,
  OptimisticMutationConfig,
  KeyingConfig,
  DataFields,
} from '../types';
import { invariant } from '../helpers/help';

import { read, readFragment } from '../operations/query';
import { writeFragment, startWrite } from '../operations/write';
import { invalidate } from '../operations/invalidate';
import { keyOfField } from './keys';
import * as InMemoryData from './data';

type RootField = 'query' | 'mutation' | 'subscription';

export class Store implements Cache {
  data: InMemoryData.InMemoryData;

  resolvers: ResolverConfig;
  updates: UpdatesConfig;
  optimisticMutations: OptimisticMutationConfig;
  keys: KeyingConfig;
  schema?: GraphQLSchema;

  rootFields: { query: string; mutation: string; subscription: string };
  rootNames: { [name: string]: RootField };

  constructor(
    rawSchema?: IntrospectionQuery,
    resolvers?: ResolverConfig,
    updates?: Partial<UpdatesConfig>,
    optimisticMutations?: OptimisticMutationConfig,
    keys?: KeyingConfig
  ) {
    this.resolvers = resolvers || {};
    this.optimisticMutations = optimisticMutations || {};
    this.keys = keys || {};

    this.updates = {
      Mutation: (updates && updates.Mutation) || {},
      Subscription: (updates && updates.Subscription) || {},
    } as UpdatesConfig;

    let queryName = 'Query';
    let mutationName = 'Mutation';
    let subscriptionName = 'Subscription';
    if (rawSchema) {
      const schema = (this.schema = buildClientSchema(rawSchema));
      const queryType = schema.getQueryType();
      const mutationType = schema.getMutationType();
      const subscriptionType = schema.getSubscriptionType();
      if (queryType) queryName = queryType.name;
      if (mutationType) mutationName = mutationType.name;
      if (subscriptionType) subscriptionName = subscriptionType.name;
    }

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

    this.data = InMemoryData.make(this.getRootKey('query'));
  }

  keyOfField = keyOfField;

  getRootKey(name: RootField) {
    return this.rootFields[name];
  }

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

  invalidateQuery(query: string | DocumentNode, variables?: Variables) {
    invalidate(this, createRequest(query, variables));
  }

  invalidate(entity: Data | string) {
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

    const fields = this.inspectFields(entityKey);
    for (const field of fields) {
      if (InMemoryData.readLink(entityKey as string, field.fieldKey)) {
        InMemoryData.writeLink(entityKey as string, field.fieldKey, undefined);
      } else {
        InMemoryData.writeRecord(
          entityKey as string,
          field.fieldKey,
          undefined
        );
      }
    }
  }

  inspectFields(entity: Data | string | null): FieldInfo[] {
    const entityKey =
      entity !== null && typeof entity !== 'string'
        ? this.keyOfEntity(entity)
        : entity;

    return entityKey !== null ? InMemoryData.inspectFields(entityKey) : [];
  }

  updateQuery(
    input: QueryInput,
    updater: (data: Data | null) => DataFields | null
  ): void {
    const request = createRequest(input.query, input.variables);
    const output = updater(this.readQuery(request as QueryInput));
    if (output !== null) {
      startWrite(this, request, output as Data);
    }
  }

  readQuery(input: QueryInput): Data | null {
    return read(this, createRequest(input.query, input.variables)).data;
  }

  readFragment(
    dataFragment: DocumentNode,
    entity: string | Data,
    variables?: Variables
  ): Data | null {
    return readFragment(this, dataFragment, entity, variables);
  }

  writeFragment(
    dataFragment: DocumentNode,
    data: Data,
    variables?: Variables
  ): void {
    writeFragment(this, dataFragment, data, variables);
  }
}
