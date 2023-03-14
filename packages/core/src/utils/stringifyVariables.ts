const seen = new Set();
const cache = new WeakMap();

const stringify = (x: any): string => {
  if (x === null || seen.has(x)) {
    return 'null';
  } else if (typeof x !== 'object') {
    return JSON.stringify(x) || '';
  } else if (x.toJSON) {
    return stringify(x.toJSON());
  } else if (Array.isArray(x)) {
    let out = '[';
    for (const value of x) {
      if (out.length > 1) out += ',';
      out += stringify(value) || 'null';
    }
    out += ']';
    return out;
  }

  const keys = Object.keys(x).sort();
  if (!keys.length && x.constructor && x.constructor !== Object) {
    const key = cache.get(x) || Math.random().toString(36).slice(2);
    cache.set(x, key);
    return `{"__key":"${key}"}`;
  }

  seen.add(x);
  let out = '{';
  for (const key of keys) {
    const value = stringify(x[key]);
    if (value) {
      if (out.length > 1) out += ',';
      out += stringify(key) + ':' + value;
    }
  }

  seen.delete(x);
  out += '}';
  return out;
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
export const stringifyVariables = (x: any): string => {
  seen.clear();
  return stringify(x);
};
