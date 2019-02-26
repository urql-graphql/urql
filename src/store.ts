import { Entity, EntityMap, KeyExtractor, Link, LinkMap } from './types';
import {
  assignObjectToMap,
  isOperation,
  keyOfEntity,
  objectOfMap,
} from './utils';

export interface StoreData {
  records: {
    [key: string]: Entity;
  };
  links: {
    [key: string]: Link;
  };
}

export interface StoreOpts {
  initial?: StoreData;
  keyExtractor?: KeyExtractor;
}

class Store {
  private touched: string[];
  private records: EntityMap;
  private links: LinkMap;

  public keyOfEntity: (entity: Entity) => null | string;

  constructor({ initial, keyExtractor }: StoreOpts) {
    this.touched = [];
    this.records = new Map();
    this.links = new Map();

    if (keyExtractor !== undefined) {
      this.keyOfEntity = (entity: Entity) => {
        const key = keyExtractor(entity);
        return key !== undefined ? key : keyOfEntity(entity);
      };
    } else {
      this.keyOfEntity = keyOfEntity;
    }

    if (initial !== undefined) {
      assignObjectToMap(this.records, initial.records);
      assignObjectToMap(this.links, initial.links);
    }
  }

  getEntity(key: string): null | Entity {
    if (!isOperation(key)) {
      this.touched.push(key);
    }

    const entity = this.records.get(key);
    return entity !== undefined ? entity : null;
  }

  getOrCreateEntity(key: string): Entity {
    const prev = this.records.get(key);
    if (prev !== undefined && prev !== null) {
      return prev;
    }

    const entity = Object.create(null);
    this.records.set(key, entity);
    return entity;
  }

  writeEntityValue(key: string, prop: string, val: any) {
    if (!isOperation(key)) {
      this.touched.push(key);
    }

    const entity = this.getOrCreateEntity(key);
    if (val === undefined) {
      delete entity[prop];
    } else {
      entity[prop] = val;
    }
  }

  getLink(key: string): Link {
    this.touched.push(key);
    const link = this.links.get(key);
    return link !== undefined ? link : null;
  }

  writeLink(key: string, link: Link) {
    this.touched.push(key);

    if (link === null) {
      this.links.delete(key);
    } else {
      this.links.set(key, link);
    }
  }

  toJSON(): StoreData {
    return {
      records: objectOfMap(this.records),
      links: objectOfMap(this.links),
    };
  }

  flushTouched(): string[] {
    const touched = this.touched.filter((key, i, arr) => {
      return arr.indexOf(key) === i;
    });

    this.touched = [];
    return touched;
  }
}

export default Store;
