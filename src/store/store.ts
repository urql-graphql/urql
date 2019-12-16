import { DocumentNode } from 'graphql';
import { createRequest } from 'urql/core';

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
} from '../types';

import { read, readFragment } from '../operations/query';
import { writeFragment, startWrite } from '../operations/write';
import { invalidate } from '../operations/invalidate';
import { SchemaPredicates } from '../ast';
import { keyOfField } from './keys';
import * as InMemoryData from './data';

type RootField = 'query' | 'mutation' | 'subscription';

export class Store implements Cache {
  data: InMemoryData.InMemoryData;

  resolvers: ResolverConfig;
  updates: UpdatesConfig;
  optimisticMutations: OptimisticMutationConfig;
  keys: KeyingConfig;
  schemaPredicates?: SchemaPredicates;

  rootFields: { query: string; mutation: string; subscription: string };
  rootNames: { [name: string]: RootField };

  constructor(
    schemaPredicates?: SchemaPredicates,
    resolvers?: ResolverConfig,
    updates?: Partial<UpdatesConfig>,
    optimisticMutations?: OptimisticMutationConfig,
    keys?: KeyingConfig
  ) {
    this.resolvers = resolvers || {};
    this.optimisticMutations = optimisticMutations || {};
    this.keys = keys || {};
    this.schemaPredicates = schemaPredicates;

    this.updates = {
      Mutation: (updates && updates.Mutation) || {},
      Subscription: (updates && updates.Subscription) || {},
    } as UpdatesConfig;

    if (schemaPredicates) {
      const { schema } = schemaPredicates;
      const queryType = schema.getQueryType();
      const mutationType = schema.getMutationType();
      const subscriptionType = schema.getSubscriptionType();

      const queryName = queryType ? queryType.name : 'Query';
      const mutationName = mutationType ? mutationType.name : 'Mutation';
      const subscriptionName = subscriptionType
        ? subscriptionType.name
        : 'Subscription';

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
    } else {
      this.rootFields = {
        query: 'Query',
        mutation: 'Mutation',
        subscription: 'Subscription',
      };

      this.rootNames = {
        Query: 'query',
        Mutation: 'mutation',
        Subscription: 'subscription',
      };
    }

    this.data = InMemoryData.make(this.getRootKey('query'));
  }

  gcScheduled = false;
  gc = () => {
    InMemoryData.gc(this.data);
    this.gcScheduled = false;
  };

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

  inspectFields(entity: Data | string | null): FieldInfo[] {
    const entityKey =
      entity !== null && typeof entity !== 'string'
        ? this.keyOfEntity(entity)
        : entity;
    return entityKey !== null ? InMemoryData.inspectFields(entityKey) : [];
  }

  updateQuery(
    input: QueryInput,
    updater: (data: Data | null) => Data | null
  ): void {
    const request = createRequest(input.query, input.variables);
    const output = updater(this.readQuery(request as QueryInput));
    if (output !== null) {
      startWrite(this, request, output);
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
