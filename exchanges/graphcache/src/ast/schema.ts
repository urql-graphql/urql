import {
  IntrospectionQuery,
  IntrospectionSchema,
  IntrospectionInputValue,
  IntrospectionTypeRef,
  IntrospectionType,
} from 'graphql';

export interface SchemaField {
  name: string;
  type: IntrospectionTypeRef;
  args: Record<string, IntrospectionInputValue>;
}

export interface SchemaObject {
  name: string;
  kind: 'INTERFACE' | 'OBJECT';
  interfaces: Record<string, unknown>;
  fields: Record<string, SchemaField>;
}

export interface SchemaUnion {
  name: string;
  kind: 'UNION';
  types: Record<string, unknown>;
}

export interface SchemaIntrospector {
  query: string | null;
  mutation: string | null;
  subscription: string | null;
  types?: Record<string, SchemaObject | SchemaUnion>;
  isSubType(abstract: string, possible: string): boolean;
}

export interface PartialIntrospectionSchema {
  queryType: { name: string; kind?: any };
  mutationType?: { name: string; kind?: any } | null;
  subscriptionType?: { name: string; kind?: any } | null;
  types?: IntrospectionSchema['types'];
}

export type IntrospectionData =
  | IntrospectionQuery
  | { __schema: PartialIntrospectionSchema };

export const buildClientSchema = ({
  __schema,
}: IntrospectionData): SchemaIntrospector => {
  const typemap: Record<string, SchemaObject | SchemaUnion> = {};

  const buildNameMap = <T extends { name: string }>(
    arr: ReadonlyArray<T>
  ): { [name: string]: T } => {
    const map: Record<string, T> = {};
    for (let i = 0; i < arr.length; i++) map[arr[i].name] = arr[i];
    return map;
  };

  const buildType = (
    type: IntrospectionType
  ): SchemaObject | SchemaUnion | void => {
    switch (type.kind) {
      case 'OBJECT':
      case 'INTERFACE':
        return {
          name: type.name,
          kind: type.kind as 'OBJECT' | 'INTERFACE',
          interfaces: buildNameMap(type.interfaces || []),
          fields: buildNameMap(
            type.fields.map(field => ({
              name: field.name,
              type: field.type,
              args: buildNameMap(field.args),
            }))
          ),
        } as SchemaObject;
      case 'UNION':
        return {
          name: type.name,
          kind: type.kind as 'UNION',
          types: buildNameMap(type.possibleTypes || []),
        } as SchemaUnion;
    }
  };

  const schema: SchemaIntrospector = {
    query: __schema.queryType ? __schema.queryType.name : null,
    mutation: __schema.mutationType ? __schema.mutationType.name : null,
    subscription: __schema.subscriptionType
      ? __schema.subscriptionType.name
      : null,
    types: undefined,
    isSubType(abstract: string, possible: string) {
      const abstractType = typemap[abstract];
      const possibleType = typemap[possible];
      if (!abstractType || !possibleType) {
        return false;
      } else if (abstractType.kind === 'UNION') {
        return !!abstractType.types[possible];
      } else if (
        abstractType.kind !== 'OBJECT' &&
        possibleType.kind === 'OBJECT'
      ) {
        return !!possibleType.interfaces[abstract];
      } else {
        return abstract === possible;
      }
    },
  };

  if (__schema.types) {
    schema.types = typemap;
    for (let i = 0; i < __schema.types.length; i++) {
      const type = __schema.types[i];
      if (type && type.name) {
        const out = buildType(type);
        if (out) typemap[type.name] = out;
      }
    }
  }

  return schema;
};
