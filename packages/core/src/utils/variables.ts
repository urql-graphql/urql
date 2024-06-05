export type FileMap = Map<string, File | Blob>;

const seen: Set<any> = new Set();
const cache: WeakMap<any, any> = new WeakMap();

const stringify = (x: any, includeFiles: boolean): string => {
  if (x === null || seen.has(x)) {
    return 'null';
  } else if (typeof x !== 'object') {
    return JSON.stringify(x) || '';
  } else if (x.toJSON) {
    return stringify(x.toJSON(), includeFiles);
  } else if (Array.isArray(x)) {
    let out = '[';
    for (const value of x) {
      if (out.length > 1) out += ',';
      out += stringify(value, includeFiles) || 'null';
    }
    out += ']';
    return out;
  } else if (
    !includeFiles &&
    ((FileConstructor !== NoopConstructor && x instanceof FileConstructor) ||
      (BlobConstructor !== NoopConstructor && x instanceof BlobConstructor))
  ) {
    return 'null';
  }

  const keys = Object.keys(x).sort();
  if (
    !keys.length &&
    x.constructor &&
    Object.getPrototypeOf(x).constructor !== Object.prototype.constructor
  ) {
    const key = cache.get(x) || Math.random().toString(36).slice(2);
    cache.set(x, key);
    return stringify({ __key: key }, includeFiles);
  }

  seen.add(x);
  let out = '{';
  for (const key of keys) {
    const value = stringify(x[key], includeFiles);
    if (value) {
      if (out.length > 1) out += ',';
      out += stringify(key, includeFiles) + ':' + value;
    }
  }

  seen.delete(x);
  out += '}';
  return out;
};

const extract = (map: FileMap, path: string, x: any): void => {
  if (x == null || typeof x !== 'object' || x.toJSON || seen.has(x)) {
    /*noop*/
  } else if (Array.isArray(x)) {
    for (let i = 0, l = x.length; i < l; i++)
      extract(map, `${path}.${i}`, x[i]);
  } else if (x instanceof FileConstructor || x instanceof BlobConstructor) {
    map.set(path, x as File | Blob);
  } else {
    seen.add(x);
    for (const key of Object.keys(x)) extract(map, `${path}.${key}`, x[key]);
  }
};

/** A stable stringifier for GraphQL variables objects.
 *
 * @param x - any JSON-like data.
 * @return A JSON string.
 *
 * @remarks
 * This utility creates a stable JSON string from any passed data,
 * and protects itself from throwing.
 *
 * The JSON string is stable insofar as objects’ keys are sorted,
 * and instances of non-plain objects are replaced with random keys
 * replacing their values, which remain stable for the objects’
 * instance.
 */
export const stringifyVariables = (x: any, includeFiles?: boolean): string => {
  seen.clear();
  return stringify(x, includeFiles || false);
};

class NoopConstructor {}
const FileConstructor = typeof File !== 'undefined' ? File : NoopConstructor;
const BlobConstructor = typeof Blob !== 'undefined' ? Blob : NoopConstructor;

export const extractFiles = (x: any): FileMap => {
  const map: FileMap = new Map();
  if (
    FileConstructor !== NoopConstructor ||
    BlobConstructor !== NoopConstructor
  ) {
    seen.clear();
    extract(map, 'variables', x);
  }
  return map;
};
