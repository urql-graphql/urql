import stringify from 'fast-json-stable-stringify';
import { Variables } from '../types';

export const keyOfField = (fieldName: string, args?: null | Variables) =>
  args ? `${fieldName}(${stringify(args)})` : fieldName;

export const joinKeys = (parentKey: string, key: string) =>
  `${parentKey}.${key}`;
