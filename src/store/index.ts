import { Entity, Link, Links, Records } from '../types';
import { assignObjectToMap, objectOfMap } from './utils';

export interface Store {
  records: Records;
  links: Links;
}

export interface SerializedStore {
  records: { [link: string]: Entity };
  links: { [link: string]: Link };
}

/** Creates a new Store with an optional initial, serialized state */
export const create = (initial?: SerializedStore): Store => {
  const records: Records = new Map();
  const links: Links = new Map();

  if (initial !== undefined) {
    assignObjectToMap(records, initial.records);
    assignObjectToMap(links, initial.links);
  }

  return { records, links };
};

/** Serializes a given Store to a plain JSON structure */
export const serialize = (store: Store): SerializedStore => {
  const records = objectOfMap(store.records);
  const links = objectOfMap(store.links);
  return { records, links };
};

export const find = (store: Store, key: string): Entity | null => {
  const entity = store.records.get(key);
  return entity !== undefined ? entity : null;
};

export const findOrCreate = (store: Store, key: string): Entity => {
  const entity = find(store, key);
  if (entity !== null) {
    return entity;
  }

  const record: Entity = Object.create(null);
  store.records.set(key, record);
  return record;
};

export const setLink = (store: Store, key: string, link: Link): void => {
  store.links.set(key, link);
};

export const deleteLink = (store: Store, key: string): void => {
  store.links.delete(key);
};

export const readLink = (store: Store, key: string): void | Link =>
  store.links.get(key);
