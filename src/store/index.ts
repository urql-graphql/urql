import { DocumentNode } from 'graphql';
import * as Pessimism from 'pessimism';

import {
  EntityField,
  Link,
  ResolverConfig,
  DataField,
  SystemFields,
  Variables,
  Data,
  UpdatesConfig,
  OptimisticMutationConfig,
} from '../types';

import { keyOfEntity, joinKeys, keyOfField } from '../helpers';
import { query, write, writeFragment } from '../operations';

interface Ref<T> {
  current: null | T;
}

const currentDependencies: Ref<Set<string>> = { current: null };
const currentOptimisticKey: Ref<number> = { current: null };

// Resolve a ref value or throw when we're outside of a store run
const refValue = <T>(ref: Ref<T>): T => {
  if (ref.current === null) {
    // TODO: Add invariant and warning with some production transpilation
    throw new Error(
      'The cache may only be mutated during operations or as part of its config.'
    );
  }

  return ref.current;
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
  refValue(currentDependencies).add(dependency);
};

const mapSet = <T>(map: Pessimism.Map<T>, key: string, value: T) => {
  const optimisticKey = refValue(currentOptimisticKey);
  return Pessimism.setOptimistic(map, key, value, optimisticKey);
};

// Used to remove a value from a Map optimistially (possible by setting it to undefined)
const mapRemove = <T>(map: Pessimism.Map<T>, key: string) => {
  const optimisticKey = refValue(currentOptimisticKey);
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

  constructor(
    resolvers?: ResolverConfig,
    updates?: UpdatesConfig,
    optimisticMutations?: OptimisticMutationConfig
  ) {
    this.records = Pessimism.make();
    this.links = Pessimism.make();
    this.resolvers = resolvers || {};
    this.updates = updates || {};
    this.optimisticMutations = optimisticMutations || {};
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

  resolve(entity: SystemFields, field: string, args?: Variables): DataField {
    if (typeof entity === 'string') {
      addDependency(entity);
      return this.resolveValueOrLink(joinKeys(entity, keyOfField(field, args)));
    } else {
      // This gives us __typename:key
      const entityKey = keyOfEntity(entity);
      if (entityKey === null) return null;
      addDependency(entityKey);
      return this.resolveValueOrLink(
        joinKeys(entityKey, keyOfField(field, args))
      );
    }
  }

  updateQuery(
    dataQuery: DocumentNode,
    updater: (data: Data | null) => Data
  ): void {
    const { data } = query(this, { query: dataQuery });
    write(this, { query: dataQuery }, updater(data));
  }

  writeFragment(dataFragment: DocumentNode, data: Data): void {
    writeFragment(this, dataFragment, data);
  }
}
