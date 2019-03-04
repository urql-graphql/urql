import { joinKeys } from '../helpers';
import { find, readLink, remove, removeLink, Store } from '../store';
import { Link } from '../types';

interface Context {
  store: Store;
  visitedLinks: Set<string>;
  visitedRecords: Set<string>;
}

export const gc = (store: Store) => {
  const visitedLinks = new Set<string>();
  const visitedRecords = new Set<string>();
  const ctx = { store, visitedLinks, visitedRecords };

  walkEntity(ctx, 'query');

  store.records.forEach((_entity, key) => {
    if (!visitedRecords.has(key)) {
      remove(store, key);
    }
  });

  store.links.forEach((_link, key) => {
    if (!visitedLinks.has(key)) {
      removeLink(store, key);
    }
  });
};

const walkEntity = (ctx: Context, key: string) => {
  const { store, visitedRecords, visitedLinks } = ctx;
  const entity = find(store, key);

  if (entity !== null && !visitedRecords.has(key)) {
    visitedRecords.add(key);

    for (const fieldKey in entity) {
      const value = entity[key];
      if (value === null) {
        const childFieldKey = joinKeys(key, fieldKey);
        const link = readLink(store, childFieldKey);
        if (link !== undefined && !visitedLinks.has(childFieldKey)) {
          visitedLinks.add(childFieldKey);
          walkLink(ctx, link);
        }
      }
    }
  }
};

const walkLink = (ctx: Context, link: Link) => {
  if (Array.isArray(link)) {
    link.forEach(childLink => walkLink(ctx, childLink));
  } else if (link !== null) {
    walkEntity(ctx, link);
  }
};
