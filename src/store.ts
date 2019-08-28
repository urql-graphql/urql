import invariant from 'invariant';
import { DocumentNode } from 'graphql';
import * as Pessimism from 'pessimism';

import {
  EntityField,
  Link,
  ResolverConfig,
  DataField,
  Variables,
  Data,
  UpdatesConfig,
  OptimisticMutationConfig,
  KeyingConfig,
} from './types';

import { keyOfEntity, joinKeys, keyOfField } from './helpers';
import { startQuery } from './operations/query';
import { writeFragment, startWrite } from './operations/write';
import { invalidate } from './operations/invalidate';

interface Ref<T> {
  current: null | T;
}

const currentDependencies: Ref<Set<string>> = { current: null };
const currentOptimisticKey: Ref<number> = { current: null };

// Resolve a ref value or throw when we're outside of a store run
const refValue = <T>(ref: Ref<T>): T => {
  invariant(
    ref.current !== null,
    'Invalid Cache call: The cache may only be accessed or mutated during' +
      'operations like write or query, or as part of its resolvers, updaters, ' +
      'or optimistic configs.'
  );

  return ref.current as T;
};

// Initialise a store run by resetting its internal state
export const initStoreState = (optimisticKey: null | number) => {
  currentDependencies.current = new Set();
  currentOptimisticKey.current = optimisticKey;
};

// Finalise a store run by clearing its internal state
export const clearStoreState = () => {
  currentDependencies.current = null;
  currentOptimisticKey.current = null;
};

export const getCurrentDependencies = () => refValue(currentDependencies);

// Add a dependency to the internal store state
export const addDependency = (dependency: string) => {
  (currentDependencies.current as Set<string>).add(dependency);
};

const mapSet = <T>(map: Pessimism.Map<T>, key: string, value: T) => {
  const optimisticKey = currentOptimisticKey.current || 0;
  return Pessimism.setOptimistic(map, key, value, optimisticKey);
};

// Used to remove a value from a Map optimistially (possible by setting it to undefined)
const mapRemove = <T>(map: Pessimism.Map<T>, key: string) => {
  const optimisticKey = currentOptimisticKey.current || 0;
  return optimisticKey
    ? Pessimism.setOptimistic(map, key, undefined, optimisticKey)
    : Pessimism.remove(map, key);
};

export class Store {
  records: Pessimism.Map<EntityField>;
  links: Pessimism.Map<Link>;

  resolvers: ResolverConfig;
  updates: UpdatesConfig;
  optimisticMutations: OptimisticMutationConfig;
  keys: KeyingConfig;

  constructor(
    resolvers?: ResolverConfig,
    updates?: Partial<UpdatesConfig>,
    optimisticMutations?: OptimisticMutationConfig,
    keys?: KeyingConfig
  ) {
    this.records = Pessimism.asMutable(Pessimism.make());
    this.links = Pessimism.asMutable(Pessimism.make());
    this.resolvers = resolvers || {};
    this.updates = {
      Mutation: (updates && updates.Mutation) || {},
      Subscription: (updates && updates.Subscription) || {},
    } as UpdatesConfig;
    this.optimisticMutations = optimisticMutations || {};
    this.keys = keys || {};
  }

  keyOfEntity(data: Data) {
    const { __typename: typename } = data;
    if (typename !== undefined && this.keys[typename] !== undefined) {
      return this.keys[typename](data);
    } else {
      return keyOfEntity(data);
    }
  }

  clearOptimistic(optimisticKey: number) {
    this.records = Pessimism.clearOptimistic(this.records, optimisticKey);
    this.links = Pessimism.clearOptimistic(this.links, optimisticKey);
  }

  getRecord(fieldKey: string): EntityField {
    return Pessimism.get(this.records, fieldKey);
  }

  removeRecord(fieldKey: string) {
    return (this.records = mapRemove(this.records, fieldKey));
  }

  writeRecord(field: EntityField, fieldKey: string) {
    return (this.records = mapSet(this.records, fieldKey, field));
  }

  getField(
    entityKey: string,
    fieldName: string,
    args?: Variables
  ): EntityField {
    const fieldKey = joinKeys(entityKey, keyOfField(fieldName, args));
    return this.getRecord(fieldKey);
  }

  writeField(
    field: EntityField,
    entityKey: string,
    fieldName: string,
    args?: Variables
  ) {
    const fieldKey = joinKeys(entityKey, keyOfField(fieldName, args));
    return (this.records = mapSet(this.records, fieldKey, field));
  }

  getLink(key: string): undefined | Link {
    return Pessimism.get(this.links, key);
  }

  removeLink(key: string) {
    return (this.links = mapRemove(this.links, key));
  }

  writeLink(link: Link, key: string) {
    return (this.links = mapSet(this.links, key, link));
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

  resolve(entity: Data | string, field: string, args?: Variables): DataField {
    if (typeof entity === 'string') {
      addDependency(entity);
      return this.resolveValueOrLink(joinKeys(entity, keyOfField(field, args)));
    } else {
      // This gives us __typename:key
      const entityKey = this.keyOfEntity(entity);
      if (entityKey === null) return null;
      addDependency(entityKey);
      return this.resolveValueOrLink(
        joinKeys(entityKey, keyOfField(field, args))
      );
    }
  }

  invalidateQuery(dataQuery: DocumentNode, variables: Variables) {
    invalidate(this, { query: dataQuery, variables });
  }

  hasField(key: string): boolean {
    return this.getRecord(key) !== undefined || this.getLink(key) !== undefined;
  }

  updateQuery(
    dataQuery: DocumentNode,
    updater: (data: Data | null) => null | Data
  ): void {
    const { data, completeness } = startQuery(this, { query: dataQuery });
    const input = completeness === 'EMPTY' ? null : data;
    const output = updater(input);
    if (output !== null) {
      startWrite(this, { query: dataQuery }, output);
    }
  }

  writeFragment(dataFragment: DocumentNode, data: Data): void {
    writeFragment(this, dataFragment, data);
  }
}
