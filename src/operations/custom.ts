import { FieldResolver } from '../types';

export const makeCustomResolver = (
  innerResolver: FieldResolver
): FieldResolver => {
  return (fieldName, rootValue, args, context, info) => {
    const { __typename: typeName } = rootValue;
    const fieldResolver = context.store.getResolver(typeName, fieldName);
    if (fieldResolver !== undefined) {
      const result = fieldResolver(args, context, info);
      if (result !== undefined) {
        return result;
      }
    }

    return innerResolver(fieldName, rootValue, args, context, info);
  };
};
