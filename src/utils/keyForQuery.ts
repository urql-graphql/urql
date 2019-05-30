import stringify from 'fast-json-stable-stringify';
import { DocumentNode, print } from 'graphql';

interface NameCache {
  [key: string]: string;
}

interface WithNameProperty {
  name?: { value: string };
  [key: string]: any;
}

interface WithCacheProperty {
  __key?: number;
  [key: string]: any;
}

const hash = (x: string): number => {
  /* prettier-ignore */
  for (var h = 5381 | 0, i = 0, l = x.length | 0; i < l; i++)
    h = ((h << 5) + h) + x.charCodeAt(i);
  return h >>> 0;
};

const docNameCache = Object.create(null) as NameCache;

export const getKeyForQuery = (doc: DocumentNode): number => {
  if ((doc as WithCacheProperty).__key !== undefined) {
    return (doc as WithCacheProperty).__key as number;
  }

  // Using print() can be expensive, so we just check the definition nodes' names
  let name = doc.definitions.reduce((acc, definition) => {
    const node = definition as WithNameProperty;
    return acc + (node.name !== undefined ? node.name.value : '');
  }, '');

  // This is for inputs that are not using constant references. In such a case
  // we use the Document names, but we can't use those if they're not unique
  if (process.env.NODE_ENV !== 'production' && name !== '') {
    const printed = print(doc);
    if (!(name in docNameCache)) {
      docNameCache[name] = printed;
    } else if (docNameCache[name] !== printed) {
      console.warn(
        'Warning: Encountered multiple DocumentNodes with the same name.'
      );
    }
  }

  // If no name is present the stringified document is used
  if (name === '') {
    name = print(doc);
  }

  const key = hash(name);
  (doc as WithCacheProperty).__key = key;
  return key;
};

export const getKeyForRequest = (
  query: DocumentNode,
  vars?: object
): number => {
  const docKey = getKeyForQuery(query);
  if (vars === undefined || vars === null) {
    return docKey;
  }

  return hash('' + docKey + stringify(vars));
};
