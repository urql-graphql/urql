import { DocumentNode } from 'graphql';
import { createRequest } from 'urql';

import {
  Cache,
  EntityField,
  Link,
  Connection,
  ResolverConfig,
  DataField,
  Variables,
  Data,
  QueryInput,
  UpdatesConfig,
  OptimisticMutationConfig,
  KeyingConfig,
} from './types';

import * as KVMap from './helpers/map';
import { joinKeys, keyOfField } from './helpers';
import { invariant, currentDebugStack } from './helpers/help';
import { read, readFragment } from './operations/query';
import { writeFragment, startWrite } from './operations/write';
import { invalidate } from './operations/invalidate';
import { SchemaPredicates } from './ast/schemaPredicates';

let currentDependencies: null | Set<string> = null;
let currentOptimisticKey: null | number = null;

// Initialise a store run by resetting its internal state
export const initStoreState = (optimisticKey: null | number) => {
  currentDependencies = new Set();
  currentOptimisticKey = optimisticKey;

  if (process.env.NODE_ENV !== 'production') {
    currentDebugStack.length = 0;
  }
};

// Finalise a store run by clearing its internal state
export const clearStoreState = () => {
  currentDependencies = null;
  currentOptimisticKey = null;

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
  records: KVMap.KVMap<EntityField>;
  connections: KVMap.KVMap<Connection[]>;
  links: KVMap.KVMap<Link>;

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
    this.records = KVMap.make();
    this.connections = KVMap.make();
    this.links = KVMap.make();

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
    KVMap.clear(this.records, optimisticKey);
    KVMap.clear(this.connections, optimisticKey);
    KVMap.clear(this.links, optimisticKey);
  }

  getRecord(fieldKey: string): EntityField {
    return KVMap.get(this.records, fieldKey);
  }

  writeRecord(field: EntityField, fieldKey: string) {
    return KVMap.set(this.records, fieldKey, field, currentOptimisticKey);
  }

  getField(
    entityKey: string,
    fieldName: string,
    args?: Variables
  ): EntityField {
    return this.getRecord(joinKeys(entityKey, keyOfField(fieldName, args)));
  }

  writeField(
    field: EntityField,
    entityKey: string,
    fieldName: string,
    args?: Variables
  ) {
    return this.writeRecord(
      field,
      joinKeys(entityKey, keyOfField(fieldName, args))
    );
  }

  getLink(key: string): undefined | Link {
    return KVMap.get(this.links, key);
  }

  writeLink(link: undefined | Link, key: string) {
    return KVMap.set(this.links, key, link, currentOptimisticKey);
  }

  writeConnection(key: string, linkKey: string, args: Variables | null) {
    if (this.getLink(linkKey) !== undefined || args === null) {
      return this.connections;
    }

    let connections = KVMap.get(this.connections, key);
    const connection: Connection = [args, linkKey];
    if (connections === undefined) {
      connections = [connection];
    } else {
      for (let i = 0, l = connections.length; i < l; i++)
        if (connections[i][1] === linkKey) return this.connections;
      connections = connections.slice();
      connections.push(connection);
    }

    return KVMap.set(this.connections, key, connections, currentOptimisticKey);
  }

  resolveValueOrLink(fieldKey: string): DataField {
    const fieldValue = this.getRecord(fieldKey);
    // Undefined implies a link OR incomplete data.
    // A value will imply that we are just fetching a field like date.
    if (fieldValue !== undefined) return fieldValue;

    // This can be an array OR a string OR undefined again
    const link = this.getLink(fieldKey);
    return link ? link : null;
  }

  resolve(
    entity: Data | string | null,
    field: string,
    args?: Variables
  ): DataField {
    if (entity === null) {
      return null;
    } else if (typeof entity === 'string') {
      addDependency(entity);
      return this.resolveValueOrLink(joinKeys(entity, keyOfField(field, args)));
    } else {
      const entityKey = this.keyOfEntity(entity);
      if (entityKey === null) return null;
      addDependency(entityKey);
      return this.resolveValueOrLink(
        joinKeys(entityKey, keyOfField(field, args))
      );
    }
  }

  resolveConnections(
    entity: Data | string | null,
    field: string
  ): Connection[] {
    let connections: undefined | Connection[];
    if (typeof entity === 'string') {
      connections = KVMap.get(this.connections, joinKeys(entity, field));
    } else if (entity !== null) {
      const entityKey = this.keyOfEntity(entity);
      if (entityKey !== null) {
        addDependency(entityKey);
        connections = KVMap.get(this.connections, joinKeys(entityKey, field));
      }
    }

    return connections !== undefined ? connections : [];
  }

  invalidateQuery(query: string | DocumentNode, variables?: Variables) {
    invalidate(this, createRequest(query, variables));
  }

  hasField(key: string): boolean {
    return this.getRecord(key) !== undefined || this.getLink(key) !== undefined;
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
