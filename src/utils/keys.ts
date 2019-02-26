import stringify from 'fast-json-stable-stringify';
import { Entity } from '../types';

export const isOperation = (typeName: string) =>
  typeName === 'Query' ||
  typeName === 'Mutation' ||
  typeName === 'Subscription';

export const keyOfEntity = (entity: Entity): null | string => {
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

export const keyForLink = (
  parentKey: string,
  fieldName: string,
  args: null | object
) => {
  const key = `${parentKey}->${fieldName}`;
  return args ? `${key}(${stringify(args)})` : key;
};
