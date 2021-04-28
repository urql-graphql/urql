import {
  IntrospectionQuery,
  IntrospectionType,
  IntrospectionTypeRef,
  IntrospectionInputValue,
} from 'graphql';

let _includeScalars = false;
let _includeEnums = false;
let _includeInputs = false;
let _hasAnyType = false;

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
      _hasAnyType = _hasAnyType || _includeScalars;
      return _includeScalars ? fromType : anyType;

    case 'INPUT_OBJECT':
      _hasAnyType = _hasAnyType || _includeInputs;
      return _includeInputs ? fromType : anyType;

    case 'ENUM':
      _hasAnyType = _hasAnyType || _includeEnums;
      return _includeEnums ? fromType : anyType;

    case 'OBJECT':
    case 'INTERFACE':
    case 'UNION':
      return fromType;

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
    case 'SCALAR':
      return {
        kind: 'SCALAR',
        name: type.name,
      };

    case 'ENUM':
      return {
        kind: 'ENUM',
        name: type.name,
        enumValues: type.enumValues.map(
          value =>
            ({
              name: value.name,
            } as any)
        ),
      };

    case 'INPUT_OBJECT': {
      return {
        kind: 'INPUT_OBJECT',
        name: type.name,
        inputFields: type.inputFields.map(
          field =>
            ({
              name: field.name,
              type: mapType(field.type),
              defaultValue: field.defaultValue || undefined,
            } as IntrospectionInputValue)
        ),
      };
    }

    case 'OBJECT':
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

    case 'INTERFACE':
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

    case 'UNION':
      return {
        kind: 'UNION',
        name: type.name,
        possibleTypes: type.possibleTypes.map(type => ({
          kind: type.kind,
          name: type.name,
        })),
      };

    default:
      return type;
  }
};

export interface MinifySchemaOptions {
  /** Includes scalar names (instead of an `Any` replacement) in the output when enabled. */
  includeScalars?: boolean;
  /** Includes enums (instead of an `Any` replacement) in the output when enabled. */
  includeEnums?: boolean;
  /** Includes all input objects (instead of an `Any` replacement) in the output when enabled. */
  includeInputs?: boolean;
  /** Includes all directives in the output when enabled. */
  includeDirectives?: boolean;
}

/** Removes extraneous information from introspected schema data to minify it and prepare it for use on the client-side. */
export const minifyIntrospectionQuery = (
  schema: IntrospectionQuery,
  opts: MinifySchemaOptions = {}
): IntrospectionQuery => {
  if (!schema || !('__schema' in schema)) {
    throw new TypeError('Expected to receive an IntrospectionQuery.');
  }

  _hasAnyType = false;
  _includeScalars = !!opts.includeScalars;
  _includeEnums = !!opts.includeEnums;
  _includeInputs = !!opts.includeInputs;

  const {
    __schema: { queryType, mutationType, subscriptionType, types, directives },
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
            (_includeEnums && type.kind === 'ENUM') ||
            (_includeInputs && type.kind === 'INPUT_OBJECT') ||
            type.kind === 'OBJECT' ||
            type.kind === 'INTERFACE' ||
            type.kind === 'UNION'
          );
      }
    })
    .map(minifyIntrospectionType);

  const minifiedDirectives = (directives || []).map(directive => ({
    name: directive.name,
    isRepeatable: directive.isRepeatable ? true : undefined,
    locations: directive.locations,
    args: directive.args.map(
      arg =>
        ({
          name: arg.name,
          type: mapType(arg.type),
          defaultValue: arg.defaultValue || undefined,
        } as IntrospectionInputValue)
    ),
  }));

  if (!_includeScalars || !_includeEnums || !_includeInputs || _hasAnyType) {
    minifiedTypes.push({ kind: 'SCALAR', name: anyType.name });
  }

  return {
    __schema: {
      queryType,
      mutationType,
      subscriptionType,
      types: minifiedTypes,
      directives: opts.includeDirectives ? minifiedDirectives : [],
    },
  };
};
