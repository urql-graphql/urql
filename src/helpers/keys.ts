import stringify from 'fast-json-stable-stringify';
import { Variables, SystemFields } from '../types';

export const isOperation = (typeName: string) =>
  typeName === 'Query' ||
  typeName === 'Mutation' ||
  typeName === 'Subscription';

export const keyOfEntity = (entity: SystemFields): null | string => {
  const { __typename: typeName } = entity;
  const id = entity.id === undefined ? entity._id : entity.id;

  if (typeName === undefined || typeName === null) {
    return null;
  } else if (isOperation(typeName)) {
    return typeName;
  } else if (id === null || id === undefined) {
    return null;
  }

  return `${typeName}:${id}`;
};

export const keyOfField = (fieldName: string, args: null | Variables) =>
  args !== null ? `${fieldName}(${stringify(args)})` : fieldName;

export const joinKeys = (parentKey: string, key: string) =>
  `${parentKey}.${key}`;
