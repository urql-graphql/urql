import {
  buildClientSchema,
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

export class SchemaPredicates {
  schema: GraphQLSchema;

  constructor(schema: object) {
    this.schema = buildClientSchema(schema as any);
  }

  isFieldNullable(typename: string, fieldName: string): boolean {
    const field = getField(this.schema, typename, fieldName);
    if (field === undefined) return false;
    return isNullableType(field.type);
  }

  isListNullable(typename: string, fieldName: string): boolean {
    const field = getField(this.schema, typename, fieldName);
    if (field === undefined) return false;
    const ofType = isNonNullType(field.type) ? field.type.ofType : field.type;
    return isListType(ofType) && isNullableType(ofType.ofType);
  }

  isFieldAvailableOnType(typename: string, fieldname: string): boolean {
    return !!getField(this.schema, typename, fieldname);
  }

  isInterfaceOfType(
    typeCondition: null | string,
    typename: string | void
  ): boolean {
    if (!typename || !typeCondition) return false;
    if (typename === typeCondition) return true;

    const abstractType = this.schema.getType(typeCondition);
    const objectType = this.schema.getType(typename);

    if (abstractType instanceof GraphQLObjectType) {
      return abstractType === objectType;
    }

    expectAbstractType(abstractType, typeCondition);
    expectObjectType(objectType, typename);

    return this.schema.isPossibleType(
      abstractType as GraphQLAbstractType,
      objectType as GraphQLObjectType
    );
  }
}

const getField = (
  schema: GraphQLSchema,
  typename: string,
  fieldName: string
) => {
  const object = schema.getType(typename) as GraphQLObjectType;
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

const expectObjectType = (type: any, typename: string) => {
  invariant(
    type instanceof GraphQLObjectType,
    'Invalid Object type: The type `' +
      typename +
      '` is not an object in the defined schema, ' +
      'but the GraphQL document is traversing it.',
    3
  );
};

const expectAbstractType = (type: any, typename: string) => {
  invariant(
    type instanceof GraphQLInterfaceType || type instanceof GraphQLUnionType,
    'Invalid Abstract type: The type `' +
      typename +
      '` is not an Interface or Union type in the defined schema, ' +
      'but a fragment in the GraphQL document is using it as a type condition.',
    5
  );
};
