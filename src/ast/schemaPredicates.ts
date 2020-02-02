import {
  isNullableType,
  isListType,
  isNonNullType,
  GraphQLSchema,
  GraphQLAbstractType,
  GraphQLObjectType,
  GraphQLInterfaceType,
  GraphQLUnionType,
} from 'graphql';

import { invariant, warn } from '../helpers/help';

export const isFieldNullable = (
  schema: GraphQLSchema,
  typename: string,
  fieldName: string
): boolean => {
  const field = getField(schema, typename, fieldName);
  if (field === undefined) return false;
  return isNullableType(field.type);
};

export const isListNullable = (
  schema: GraphQLSchema,
  typename: string,
  fieldName: string
): boolean => {
  const field = getField(schema, typename, fieldName);
  if (field === undefined) return false;
  const ofType = isNonNullType(field.type) ? field.type.ofType : field.type;
  return isListType(ofType) && isNullableType(ofType.ofType);
};

export const isFieldAvailableOnType = (
  schema: GraphQLSchema,
  typename: string,
  fieldName: string
): boolean => {
  return !!getField(schema, typename, fieldName);
};

export const isInterfaceOfType = (
  schema: GraphQLSchema,
  typeCondition: null | string,
  typename: string | void
): boolean => {
  if (!typename || !typeCondition) return false;
  if (typename === typeCondition) return true;

  const abstractType = schema.getType(typeCondition);
  const objectType = schema.getType(typename);

  if (abstractType instanceof GraphQLObjectType) {
    return abstractType === objectType;
  }

  expectAbstractType(abstractType, typeCondition);
  expectObjectType(objectType, typename);
  return schema.isPossibleType(abstractType, objectType);
};

const getField = (
  schema: GraphQLSchema,
  typename: string,
  fieldName: string
) => {
  const object = schema.getType(typename);
  expectObjectType(object, typename);

  const field = object.getFields()[fieldName];
  if (field === undefined) {
    warn(
      'Invalid field: The field `' +
        fieldName +
        '` does not exist on `' +
        typename +
        '`, ' +
        'but the GraphQL document expects it to exist.\n' +
        'Traversal will continue, however this may lead to undefined behavior!',
      4
    );

    return undefined;
  }

  return field;
};

function expectObjectType(
  x: any,
  typename: string
): asserts x is GraphQLObjectType {
  invariant(
    x instanceof GraphQLObjectType,
    'Invalid Object type: The type `' +
      typename +
      '` is not an object in the defined schema, ' +
      'but the GraphQL document is traversing it.',
    3
  );
}

function expectAbstractType(
  x: any,
  typename: string
): asserts x is GraphQLAbstractType {
  invariant(
    x instanceof GraphQLInterfaceType || x instanceof GraphQLUnionType,
    'Invalid Abstract type: The type `' +
      typename +
      '` is not an Interface or Union type in the defined schema, ' +
      'but a fragment in the GraphQL document is using it as a type condition.',
    5
  );
}
