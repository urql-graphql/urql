const seen = new Set();
const cache = new WeakMap();

const stringify = (x: any): string => {
  if (x === null) {
    return 'null';
  } else if (typeof x !== 'object') {
    return JSON.stringify(x) || '';
  } else if (x.toJSON) {
    return x.toJSON();
  }

  let out = '';
  if (Array.isArray(x)) {
    out = '[';
    for (let i = 0, l = x.length; i < l; i++) {
      if (i > 0) out += ',';
      const value = stringify(x[i]);
      out += value.length > 0 ? value : 'null';
    }

    out += ']';
    return out;
  } else if (seen.has(x)) {
    return 'null';
  }

  const keys = Object.keys(x).sort();
  if (!keys.length && x.constructor && x.constructor !== Object) {
    const key =
      cache.get(x) ||
      Math.random()
        .toString(36)
        .slice(2);
    cache.set(x, key);
    return `{"__key":"${key}"}`;
  }

  seen.add(x);
  out = '{';
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i];
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

export const stringifyVariables = (x: any): string => {
  seen.clear();
  return stringify(x);
};
