import { Cache, Entity, Link } from './types';

export const createCache = (initial?: Cache): Cache => {
  const records = Object.create(null);
  const links = Object.create(null);
  if (initial !== undefined) {
    Object.assign(records, initial.records);
    Object.assign(links, initial.links);
  }

  return { records, links };
};

export const getOrCreateEntity = (cache: Cache, key: string): Entity => {
  const { records } = cache;
  let entity = records[key];
  if (entity === undefined) {
    entity = records[key] = Object.create(null);
  }

  return entity;
};

export const writeLink = (cache: Cache, linkKey: string, childKey: Link) => {
  const { links } = cache;
  links[linkKey] = childKey;
};

export const deleteLink = (cache: Cache, linkKey: string) => {
  const { links } = cache;
  delete links[linkKey];
};

export const writeFieldValue = (
  entity: Entity,
  fieldName: string,
  fieldValue: any
) => {
  entity[fieldName] = fieldValue;
};

export const deleteFieldValue = (entity: Entity, fieldName: string) => {
  delete entity[fieldName];
};
