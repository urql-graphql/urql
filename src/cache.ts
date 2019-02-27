import Store from './store';
import { Entity, FieldValue } from './types';
import { keyForLink } from './utils';

const entityOfLink = (store: Store, link: Link) => {
  if (Array.isArray(link)) {
    // @ts-ignore
    return link.map(inner => entityOfLink(store, inner));
  } else if (link === null || typeof link !== 'string') {
    return null;
  }

  return store.getEntity(link);
};

/** This is an interface to mutate or access the cache directly */
class Cache {
  store: Store;

  constructor(store: Store) {
    this.store = store;
  }

  entity(entity: Entity): null | Entity {
    const key = this.store.keyOfEntity(entity);
    return key !== null ? this.store.getEntity(key) : null;
  }

  link(entity: Entity, fieldName: string, args: null | object): FieldValue {
    const parentKey = this.store.keyOfEntity(entity);
    if (parentKey === null) {
      return null;
    }

    const key = keyForLink(parentKey, fieldName, args);
    const link = this.store.getLink(key);
    if (link === null) {
      return null;
    }

    return entityOfLink(this.store, link);
  }
}

export default Cache;
