import { Entity, EntityMap, Link, LinkMap } from './types';

export interface CacheData {
  records: EntityMap;
  links: LinkMap;
}

class Cache implements CacheData {
  records: EntityMap;
  links: LinkMap;

  constructor(initial?: CacheData) {
    this.records = Object.create(null);
    this.links = Object.create(null);
    if (initial !== undefined) {
      Object.assign(this.records, initial.records);
      Object.assign(this.links, initial.links);
    }
  }

  getEntity(key: string): Entity {
    let entity = this.records[key];
    if (entity === undefined) {
      entity = this.records[key] = Object.create(null);
    }

    return entity;
  }

  writeEntityValue(key: string, prop: string, val: any) {
    const entity = this.getEntity(key);
    if (val === null || val === undefined) {
      delete entity[prop];
    } else {
      entity[prop] = val;
    }
  }

  getLink(key: string): Link {
    const link = this.links[key];
    return link !== undefined ? link : null;
  }

  writeLink(key: string, link: Link) {
    if (link === null) {
      delete this.links[key];
    } else {
      this.links[key] = link;
    }
  }

  toJSON() {
    return { records: this.records, links: this.links };
  }
}

export default Cache;
