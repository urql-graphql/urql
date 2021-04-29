import { stringifyVariables } from '@urql/core';
import { FieldArgs, FieldInfo, KeyInfo } from '../types';

export const keyOfField = (fieldName: string, args?: FieldArgs) =>
  args ? `${fieldName}(${stringifyVariables(args)})` : fieldName;

export const joinKeys = (parentKey: string, key: string) =>
  `${parentKey}.${key}`;

export const fieldInfoOfKey = (fieldKey: string): FieldInfo => {
  const parenIndex = fieldKey.indexOf('(');
  if (parenIndex > -1) {
    return {
      fieldKey,
      fieldName: fieldKey.slice(0, parenIndex),
      arguments: JSON.parse(fieldKey.slice(parenIndex + 1, -1)),
    };
  } else {
    return {
      fieldKey,
      fieldName: fieldKey,
      arguments: null,
    };
  }
};

export const serializeKeys = (entityKey: string, fieldKey: string) =>
  `${entityKey.replace(/\./g, '%2e')}.${fieldKey}`;

export const deserializeKeyInfo = (key: string): KeyInfo => {
  const dotIndex = key.indexOf('.');
  const entityKey = key.slice(0, dotIndex).replace(/%2e/g, '.');
  const fieldKey = key.slice(dotIndex + 1);
  return { entityKey, fieldKey };
};
