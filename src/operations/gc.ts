import { joinKeys } from '../helpers';
import { Store } from '../store';
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

  walkEntity(ctx, 'Query');

  store.records.forEach((_entity, key) => {
    if (!visitedRecords.has(key)) {
      store.remove(key);
    }
  });

  store.links.forEach((_link, key) => {
    if (!visitedLinks.has(key)) {
      store.removeLink(key);
    }
  });
};

const walkEntity = (ctx: Context, key: string) => {
  const { store, visitedRecords, visitedLinks } = ctx;
  const entity = store.find(key);

  if (entity !== null && !visitedRecords.has(key)) {
    visitedRecords.add(key);

    for (const fieldKey in entity) {
      const value = entity[fieldKey];
      if (value === undefined) {
        const childFieldKey = joinKeys(key, fieldKey);
        const link = store.readLink(childFieldKey);
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
    link.forEach(childLink => {
      walkLink(ctx, childLink);
    });
  } else if (link !== null) {
    walkEntity(ctx, link);
  }
};
