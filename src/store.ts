import { DocumentNode } from 'graphql';
import { createRequest } from 'urql';

import {
  Cache,
  EntityField,
  Link,
  FieldInfo,
  ResolverConfig,
  DataField,
  Variables,
  Data,
  QueryInput,
  UpdatesConfig,
  OptimisticMutationConfig,
  KeyingConfig,
} from './types';

import * as InMemoryData from './helpers/data';
import { invariant, currentDebugStack } from './helpers/help';
import { defer, keyOfField } from './helpers';
import { read, readFragment } from './operations/query';
import { writeFragment, startWrite } from './operations/write';
import { invalidate } from './operations/invalidate';
import { SchemaPredicates } from './ast/schemaPredicates';

let currentStore: null | Store = null;
let currentDependencies: null | Set<string> = null;

// Initialise a store run by resetting its internal state
export const initStoreState = (store: Store, optimisticKey: null | number) => {
  InMemoryData.setCurrentOptimisticKey(optimisticKey);
  currentStore = store;
  currentDependencies = new Set();

  if (process.env.NODE_ENV !== 'production') {
    currentDebugStack.length = 0;
  }
};

// Finalise a store run by clearing its internal state
export const clearStoreState = () => {
  if (!(currentStore as Store).gcScheduled) {
    defer((currentStore as Store).gc);
  }

  InMemoryData.setCurrentOptimisticKey(null);
  currentStore = null;
  currentDependencies = null;

  if (process.env.NODE_ENV !== 'production') {
    currentDebugStack.length = 0;
  }
};

export const getCurrentDependencies = (): Set<string> => {
  invariant(
    currentDependencies !== null,
    'Invalid Cache call: The cache may only be accessed or mutated during' +
      'operations like write or query, or as part of its resolvers, updaters, ' +
      'or optimistic configs.',
    2
  );

  return currentDependencies;
};

// Add a dependency to the internal store state
export const addDependency = (dependency: string) => {
  (currentDependencies as Set<string>).add(dependency);
};

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
    this.data = InMemoryData.make();

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

  clearOptimistic(optimisticKey: number) {
    InMemoryData.clearOptimistic(this.data, optimisticKey);
  }

  getRecord(entityKey: string, fieldKey: string): EntityField {
    return InMemoryData.readRecord(this.data, entityKey, fieldKey);
  }

  writeRecord(field: EntityField, entityKey: string, fieldKey: string) {
    InMemoryData.writeRecord(this.data, entityKey, fieldKey, field);
  }

  getField(
    entityKey: string,
    fieldName: string,
    args?: Variables
  ): EntityField {
    return InMemoryData.readRecord(
      this.data,
      entityKey,
      keyOfField(fieldName, args)
    );
  }

  writeField(
    field: EntityField,
    entityKey: string,
    fieldName: string,
    args?: Variables
  ) {
    return this.writeRecord(field, entityKey, keyOfField(fieldName, args));
  }

  getLink(entityKey: string, fieldKey: string): undefined | Link {
    return InMemoryData.readLink(this.data, entityKey, fieldKey);
  }

  writeLink(link: undefined | Link, entityKey: string, fieldKey: string) {
    return InMemoryData.writeLink(this.data, entityKey, fieldKey, link);
  }

  resolveFieldByKey(entity: Data | string | null, fieldKey: string): DataField {
    const entityKey =
      entity !== null && typeof entity !== 'string'
        ? this.keyOfEntity(entity)
        : entity;
    if (entityKey === null) return null;
    addDependency(entityKey);
    const fieldValue = InMemoryData.readRecord(this.data, entityKey, fieldKey);
    if (fieldValue !== undefined) return fieldValue;
    const link = InMemoryData.readLink(this.data, entityKey, fieldKey);
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

  hasField(entityKey: string, fieldKey: string): boolean {
    return (
      InMemoryData.readRecord(this.data, entityKey, fieldKey) !== undefined ||
      InMemoryData.readLink(this.data, entityKey, fieldKey) !== undefined
    );
  }

  inspectFields(entity: Data | string | null): FieldInfo[] {
    const entityKey =
      entity !== null && typeof entity !== 'string'
        ? this.keyOfEntity(entity)
        : entity;
    return entityKey !== null
      ? InMemoryData.inspectFields(this.data, entityKey)
      : [];
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
