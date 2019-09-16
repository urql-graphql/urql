const seen = new Set();

const stringify = (x: any): string => {
  if (x === undefined) {
    return '';
  } else if (typeof x == 'number') {
    return isFinite(x) ? '' + x : 'null';
  } else if (typeof x !== 'object') {
    return JSON.stringify(x);
  } else if (x === null) {
    return 'null';
  }

  let out = '[';
  if (Array.isArray(x)) {
    for (let i = 0, l = x.length; i < l; i++) {
      if (i > 0) out += ',';
      const value = stringify(x[i]);
      out += value.length > 0 ? value : 'null';
    }

    return out + ']';
  } else if (seen.has(x)) {
    throw new TypeError('Converting circular structure to JSON');
  }

  const keys = Object.keys(x).sort();

  seen.add(x);
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = stringify(keys[i]);
    const value = stringify(x[key]);
    if (value.length !== 0) {
      if (out.length > 0) out += ',';
      out += key + ':' + value;
    }
  }

  seen.delete(x);
  return '{' + out + '}';
};

export const stringifyVariables = (x: any): string => {
  seen.clear();
  return stringify(x);
};
