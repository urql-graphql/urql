import {
  IntrospectionQuery,
  IntrospectionType,
  IntrospectionTypeRef,
} from 'graphql';

const anyType: IntrospectionTypeRef = {
  kind: 'SCALAR',
  name: 'Any',
};

const mapType = (
  fromType: any,
  toType: IntrospectionTypeRef
): IntrospectionTypeRef => {
  switch (fromType.kind) {
    case 'NON_NULL':
    case 'LIST':
      return {
        kind: fromType.kind,
        ofType: mapType(fromType.ofType, toType),
      };

    case 'SCALAR':
    case 'INPUT_OBJECT':
    case 'ENUM':
      return toType;

    case 'OBJECT':
    case 'INTERFACE':
    case 'UNION':
      return {
        kind: fromType.kind,
        name: fromType.name,
      };

    default:
      throw new TypeError(
        `Unrecognized type reference of type: ${(fromType as any).kind}.`
      );
  }
};

const minifyIntrospectionType = (
  type: IntrospectionType
): IntrospectionType => {
  switch (type.kind) {
    case 'OBJECT': {
      return {
        kind: 'OBJECT',
        name: type.name,
        fields: type.fields.map(
          field =>
            ({
              name: field.name,
              type: field.type && mapType(field.type, anyType),
              args:
                field.args &&
                field.args.map(arg => ({
                  ...arg,
                  type: mapType(arg.type, anyType),
                  defaultValue: undefined,
                })),
            } as any)
        ),
        interfaces:
          type.interfaces &&
          type.interfaces.map(int => ({
            kind: 'INTERFACE',
            name: int.name,
          })),
      };
    }

    case 'INTERFACE': {
      return {
        kind: 'INTERFACE',
        name: type.name,
        fields: type.fields.map(
          field =>
            ({
              name: field.name,
              type: field.type && mapType(field.type, anyType),
              args:
                field.args &&
                field.args.map(arg => ({
                  ...arg,
                  type: mapType(arg.type, anyType),
                  defaultValue: undefined,
                })),
            } as any)
        ),
        interfaces:
          type.interfaces &&
          type.interfaces.map(int => ({
            kind: 'INTERFACE',
            name: int.name,
          })),
        possibleTypes:
          type.possibleTypes &&
          type.possibleTypes.map(type => ({
            kind: type.kind,
            name: type.name,
          })),
      };
    }

    case 'UNION': {
      return {
        kind: 'UNION',
        name: type.name,
        possibleTypes: type.possibleTypes.map(type => ({
          kind: type.kind,
          name: type.name,
        })),
      };
    }

    default:
      return type;
  }
};

export const minifyIntrospectionQuery = (
  schema: IntrospectionQuery
): IntrospectionQuery => {
  if (!schema || !('__schema' in schema)) {
    throw new TypeError('Expected to receive an IntrospectionQuery.');
  }

  const {
    __schema: { queryType, mutationType, subscriptionType, types },
  } = schema;

  const minifiedTypes = types
    .filter(
      type =>
        type.kind === 'OBJECT' ||
        type.kind === 'INTERFACE' ||
        type.kind === 'UNION'
    )
    .map(minifyIntrospectionType);

  minifiedTypes.push({ kind: 'SCALAR', name: anyType.name });

  return {
    __schema: {
      queryType,
      mutationType,
      subscriptionType,
      types: minifiedTypes,
      directives: [],
    },
  };
};
