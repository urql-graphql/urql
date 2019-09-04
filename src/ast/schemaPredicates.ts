import invariant from 'invariant';
import warning from 'warning';

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

export class SchemaPredicates {
  schema: GraphQLSchema;

  constructor(schema) {
    this.schema = buildClientSchema(schema);
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

  isInterfaceOfType(
    typeCondition: null | string,
    typename: string | void
  ): boolean {
    if (!typename || !typeCondition) return false;
    if (typename === typeCondition) return true;

    const abstractType = this.schema.getType(typeCondition);
    expectAbstractType(abstractType, typeCondition);
    const objectType = this.schema.getType(typename);
    expectObjectType(objectType, typename);

    const abstractNode = abstractType as GraphQLAbstractType;
    const concreteNode = objectType as GraphQLObjectType;
    return this.schema.isPossibleType(abstractNode, concreteNode);
  }
}

const getField = (
  schema: GraphQLSchema,
  typename: string,
  fieldName: string
) => {
  const type = schema.getType(typename);
  expectObjectType(type, typename);

  const object = type as GraphQLObjectType;
  if (object === undefined) {
    warning(
      false,
      'Invalid type: The type `%s` is not a type in the defined schema, ' +
        'but the GraphQL document expects it to exist.\n' +
        'Traversal will continue, however this may lead to undefined behavior!',
      typename
    );

    return undefined;
  }

  const field = object.getFields()[fieldName];
  if (field === undefined) {
    warning(
      false,
      'Invalid field: The field `%s` does not exist on `%s`, ' +
        'but the GraphQL document expects it to exist.\n' +
        'Traversal will continue, however this may lead to undefined behavior!',
      fieldName,
      typename
    );

    return undefined;
  }

  return field;
};

const expectObjectType = (type: any, typename: string) => {
  invariant(
    type instanceof GraphQLObjectType,
    'Invalid type: The type `%s` is not an object in the defined schema, ' +
      'but the GraphQL document is traversing it.',
    typename
  );
};

const expectAbstractType = (type: any, typename: string) => {
  invariant(
    type instanceof GraphQLInterfaceType || type instanceof GraphQLUnionType,
    'Invalid type: The type `%s` is not an Interface or Union type in the defined schema, ' +
      'but a fragment in the GraphQL document is using it as a type condition.',
    typename
  );
};
