import stringify from 'fast-json-stable-stringify';
import { Variables, KeyGenerator, Data } from '../types';

export const isOperation = (typeName: string) =>
  typeName === 'Query' ||
  typeName === 'Mutation' ||
  typeName === 'Subscription';

export const keyOfEntity: KeyGenerator = (data: Data): null | string => {
  const { __typename: typeName } = data;
  const id = data.id === undefined ? data._id : data.id;

  if (typeName === undefined || typeName === null) {
    return null;
  } else if (isOperation(typeName)) {
    return typeName;
  } else if (id === null || id === undefined) {
    return null;
  }

  return `${typeName}:${id}`;
};

export const keyOfField = (fieldName: string, args?: null | Variables) =>
  args ? `${fieldName}(${stringify(args)})` : fieldName;

export const joinKeys = (parentKey: string, key: string) =>
  `${parentKey}.${key}`;
