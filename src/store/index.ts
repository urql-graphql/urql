import {
  Entity,
  Link,
  LinksMap,
  EntitiesMap,
  ResolverConfig,
  ResolverResult,
  SystemFields,
  Variables,
} from '../types';

import { keyOfEntity, joinKeys, keyOfField } from '../helpers';
import { assignObjectToMap, objectOfMap } from './utils';

export interface SerializedStore {
  records: { [link: string]: Entity };
  links: { [link: string]: Link };
}

export class Store {
  records: EntitiesMap;
  links: LinksMap;

  resolvers: ResolverConfig;

  constructor(initial?: SerializedStore, resolvers?: ResolverConfig) {
    this.records = new Map();
    this.links = new Map();
    this.resolvers = resolvers || {};

    if (initial !== undefined) {
      assignObjectToMap(this.records, initial.records);
      assignObjectToMap(this.links, initial.links);
    }
  }

  serialize(): SerializedStore {
    const records = objectOfMap(this.records);
    const links = objectOfMap(this.links);
    return { records, links };
  }

  find(key: string): Entity | null {
    const entity = this.records.get(key);
    return entity !== undefined ? entity : null;
  }

  findOrCreate(key: string): Entity {
    const entity = this.find(key);
    if (entity !== null) {
      return entity;
    }

    const record: Entity = Object.create(null);
    this.records.set(key, record);
    return record;
  }

  readLink(key: string): void | Link {
    return this.links.get(key);
  }

  remove(key: string): void {
    this.records.delete(key);
  }

  setLink(key: string, link: Link): void {
    this.links.set(key, link);
  }

  removeLink(key: string): void {
    this.links.delete(key);
  }

  resolveEntity(entity: SystemFields): Entity | null {
    const key = keyOfEntity(entity);
    return key !== null ? this.find(key) : null;
  }

  resolveProperty(
    parent: Entity,
    field: string,
    args?: null | Variables
  ): ResolverResult {
    const fieldKey = keyOfField(field, args || null);
    const fieldValue = parent[fieldKey];
    if (fieldValue === undefined) {
      return null;
    } else if (fieldValue !== null) {
      return fieldValue;
    }

    const entityKey = keyOfEntity(parent);
    if (entityKey === null) {
      return null;
    }

    const link = this.readLink(joinKeys(entityKey, fieldKey));
    if (!link) {
      return null;
    } else if (Array.isArray(link)) {
      // @ts-ignore: Link cannot be expressed as a recursive type
      return link.map(key => this.find(key));
    } else {
      return this.find(link);
    }
  }
}
