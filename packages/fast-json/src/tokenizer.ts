let str = '';
let idx = 0;

export const index = () => idx | 0;

export const init = (_str: string) => {
  str = _str;
  idx = 0;
};

export const takeNull = (): boolean => {
  let char: number;
  while ((char = str.charCodeAt(idx++)) <= 32 /*'\n'*/);
  switch (char) {
    case 110 /*'n'*/:
      idx += 3;
      return true;
    default:
      idx--;
      return false;
  }
};

export const takeDelimiter = (): number => {
  let char: number;
  while ((char = str.charCodeAt(idx++)) < 32 /*'\n'*/);
  return char;
};

export const takeBoolean = (): boolean => {
  let char: number;
  while ((char = str.charCodeAt(idx++)) <= 32 /*'\n'*/);
  switch (char) {
    case 102 /*'f'*/:
      idx += 4;
      return false;
    case 116 /*'t'*/:
      idx += 3;
      return true;
    default:
      takeDelimiter();
      idx--;
      return false;
  }
};

export const takeInteger = (): number => {
  let char: number;
  while ((char = str.charCodeAt(idx++)) < 32 /*'\n'*/);
  idx--;

  const prevIdx = idx;
  if (str.charCodeAt(idx++) !== 45 /*'-'*/) idx--;

  while ((char = str.charCodeAt(idx++)) >= 48 && char <= 57);
  idx--;

  return parseInt(str.slice(prevIdx, idx), 10) || 0;
};

export const takeFloat = (): number => {
  let char: number;
  while ((char = str.charCodeAt(idx++)) < 32 /*'\n'*/);
  idx--;

  // FIXME: Is it faster to just read until the next delimiter?
  const prevIdx = idx;
  if (char === 45 /*'-'*/ || char === 43 /*'+'*/) idx++;
  while ((char = str.charCodeAt(idx++)) >= 48 && char <= 57);
  idx--;

  if (str.charCodeAt(idx) === 46 /*'.'*/) {
    str.charCodeAt(idx++);
    while ((char = str.charCodeAt(idx++)) >= 48 && char <= 57);
    idx--;
  }

  if (
    str.charCodeAt(idx) === 101 /*'e'*/ ||
    str.charCodeAt(idx) === 69 /*'E'*/
  ) {
    str.charCodeAt(idx++); // skips sign
    while ((char = str.charCodeAt(idx++)) >= 48 && char <= 57);
    idx--;
  }

  return parseFloat(str.slice(prevIdx, idx)) || 0;
};

export const takeString = (): string => {
  let char: number;
  while ((char = str.charCodeAt(idx++)) !== 34 /*'"'*/);

  let prevIdx = idx;
  let out = '';
  while ((char = str.charCodeAt(idx++)) !== 34 /*'"'*/) {
    switch (char) {
      case 92 /*'\\'*/:
        const end = idx - 1;
        switch ((char = str.charCodeAt(idx++))) {
          case 98 /*'\b'*/:
            char = 8;
            break;
          case 102 /*'\f'*/:
            char = 12;
            break;
          case 110 /*'\n'*/:
            char = 10;
            break;
          case 114 /*'\r'*/:
            char = 13;
            break;
          case 116 /*'\r'*/:
            char = 9;
            break;
          case 117 /*'\u'*/:
            char = parseInt(str.slice(idx, (idx += 4)), 16) | 0;
            break;
        }

        out += str.slice(prevIdx, end) + String.fromCharCode(char);
        prevIdx = idx;
        break;
      default:
        continue;
    }
  }

  return out + str.slice(prevIdx, idx - 1);
};

export const takeProperty = (): void => {
  // Assuming a match of /"\w+":/ at least 3 chars may immediately be skipped
  idx += 3;
  while (str.charCodeAt(idx++) !== 58 /*':'*/);
};

export const takeAny = (): any => {
  const prevIdx = idx;

  let depth = 0;
  let char: number;
  loop: while ((char = str.charCodeAt(idx++))) {
    switch (char) {
      case 123 /*'{'*/:
      case 91 /*'['*/:
        depth++;
        break;
      case 125 /*'}'*/:
      case 93 /*']'*/:
        if (depth) {
          if (--depth) break;
          break loop;
        } else {
          idx--;
          break loop;
        }
      case 34 /*'"'*/:
        while ((char = str.charCodeAt(idx++)) && char !== 34 /*'"'*/)
          if (char === 92 /*'\\'*/) str.charCodeAt(idx++);
        break;
      case 44 /*','*/:
        if (depth) continue;
        idx--;
        break loop;
      case 0 /*'\0'*/:
        break loop;
    }
  }

  return JSON.parse(str.slice(prevIdx, idx));
};

export const tokens = {
  null: takeNull,
  bool: takeBoolean,
  delim: takeDelimiter,
  int: takeInteger,
  float: takeFloat,
  str: takeString,
  prop: takeProperty,
  any: takeAny,
} as const;

export const _tokens: Record<keyof typeof tokens, string> = {
  null: 'tokens.null',
  bool: 'tokens.bool',
  delim: 'tokens.delim',
  int: 'tokens.int',
  float: 'tokens.float',
  str: 'tokens.str',
  prop: 'tokens.prop',
  any: 'tokens.any',
} as const;
