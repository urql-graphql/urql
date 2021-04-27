import {
  IntrospectionQuery,
  IntrospectionType,
  IntrospectionTypeRef,
} from 'graphql';

let _includeScalars: boolean = false;

const anyType: IntrospectionTypeRef = {
  kind: 'SCALAR',
  name: 'Any',
};

const mapType = (fromType: any): IntrospectionTypeRef => {
  switch (fromType.kind) {
    case 'NON_NULL':
    case 'LIST':
      return {
        kind: fromType.kind,
        ofType: mapType(fromType.ofType),
      };

    case 'SCALAR':
      return _includeScalars ? fromType : anyType;

    case 'INPUT_OBJECT':
    case 'ENUM':
      return anyType;

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
  type: IntrospectionType,
): IntrospectionType => {
  switch (type.kind) {
    case 'SCALAR':
      return {
        kind: 'SCALAR',
        name: type.name,
      };

    case 'OBJECT': {
      return {
        kind: 'OBJECT',
        name: type.name,
        fields: type.fields.map(
          field =>
            ({
              name: field.name,
              type: field.type && mapType(field.type),
              args:
                field.args &&
                field.args.map(arg => ({
                  name: arg.name,
                  type: mapType(arg.type),
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
              type: field.type && mapType(field.type),
              args:
                field.args &&
                field.args.map(arg => ({
                  name: arg.name,
                  type: mapType(arg.type),
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

export interface MinifySchemaOptions {
  includeScalars?: boolean;
}

export const minifyIntrospectionQuery = (
  schema: IntrospectionQuery,
  opts: MinifySchemaOptions = {}
): IntrospectionQuery => {
  if (!schema || !('__schema' in schema)) {
    throw new TypeError('Expected to receive an IntrospectionQuery.');
  }

  _includeScalars = !!opts.includeScalars;

  const {
    __schema: { queryType, mutationType, subscriptionType, types },
  } = schema;

  const minifiedTypes = types
    .filter(type => {
      switch (type.name) {
        case '__Directive':
        case '__DirectiveLocation':
        case '__EnumValue':
        case '__InputValue':
        case '__Field':
        case '__Type':
        case '__TypeKind':
        case '__Schema':
          return false;
        default:
          return (
            (_includeScalars && type.kind === 'SCALAR') ||
            type.kind === 'OBJECT' ||
            type.kind === 'INTERFACE' ||
            type.kind === 'UNION'
          );
      }
    })
    .map(minifyIntrospectionType);

  if (_includeScalars) {
    minifiedTypes.push({ kind: 'SCALAR', name: anyType.name });
  }

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
