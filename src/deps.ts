import Cache from './cache';
import { isOperation } from './keys';

export interface Dependencies {
  records: string[];
  links: string[];
}

class DepsCache {
  private records: string[];
  private links: string[];
  private cache: Cache;

  constructor(cache: Cache) {
    this.cache = cache;
    this.records = [];
    this.links = [];
  }

  getEntity(key) {
    this.records.push(key);
    return this.cache.getEntity(key);
  }

  writeEntityValue(key, prop, val) {
    this.records.push(key);
    return this.cache.writeEntityValue(key, prop, val);
  }

  getLink(key) {
    this.links.push(key);
    return this.cache.getLink(key);
  }

  writeLink(key, link) {
    this.links.push(key);
    return this.cache.writeLink(key, link);
  }

  getDependencies(): Dependencies {
    return {
      records: this.records.filter((key, i, arr) => {
        return !isOperation(key) && arr.indexOf(key) === i;
      }),
      links: this.links.filter((key, i, arr) => {
        return arr.indexOf(key) === i;
      }),
    };
  }
}

export default DepsCache;
