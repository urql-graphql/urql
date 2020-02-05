import { stringifyVariables } from 'urql/core';
import { Variables, FieldInfo } from '../types';

export const keyOfField = (fieldName: string, args?: null | Variables) =>
  args ? `${fieldName}(${stringifyVariables(args)})` : fieldName;

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

export const joinKeys = (parentKey: string, key: string) =>
  `${parentKey}.${key}`;

/** Prefix key with its owner type Link / Record */
export const prefixKey = (owner: 'l' | 'r', key: string) => `${owner}|${key}`;
