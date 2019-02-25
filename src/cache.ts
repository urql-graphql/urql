import { isOperation } from './keys';
import { Entity, EntityMap, Link, LinkMap } from './types';

export interface CacheData {
  records: EntityMap;
  links: LinkMap;
}

class Cache {
  private touched: string[];
  private records: EntityMap;
  private links: LinkMap;

  constructor(initial?: CacheData) {
    this.touched = [];
    this.records = Object.create(null);
    this.links = Object.create(null);
    if (initial !== undefined) {
      Object.assign(this.records, initial.records);
      Object.assign(this.links, initial.links);
    }
  }

  getEntity(key: string): Entity {
    if (!isOperation(key)) {
      this.touched.push(key);
    }

    let entity = this.records[key];
    if (entity === undefined) {
      entity = this.records[key] = Object.create(null);
    }

    return entity;
  }

  writeEntityValue(key: string, prop: string, val: any) {
    if (!isOperation(key)) {
      this.touched.push(key);
    }

    const entity = this.getEntity(key);
    if (val === null || val === undefined) {
      delete entity[prop];
    } else {
      entity[prop] = val;
    }
  }

  getLink(key: string): Link {
    this.touched.push(key);
    const link = this.links[key];
    return link !== undefined ? link : null;
  }

  writeLink(key: string, link: Link) {
    this.touched.push(key);

    if (link === null) {
      delete this.links[key];
    } else {
      this.links[key] = link;
    }
  }

  toJSON(): CacheData {
    return { records: this.records, links: this.links };
  }

  flushTouched(): string[] {
    const touched = this.touched.filter(
      (key, i, arr) => arr.indexOf(key) === i
    );
    this.touched = [];
    return touched;
  }
}

export default Cache;
