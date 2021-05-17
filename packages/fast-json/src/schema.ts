import {
  IntrospectionQuery,
  IntrospectionSchema,
  IntrospectionTypeRef,
  IntrospectionType,
} from 'graphql';

export interface SchemaField {
  name: string;
  type: IntrospectionTypeRef;
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

export interface PartialIntrospectionSchema {
  queryType: { name: string; kind?: any };
  mutationType?: { name: string; kind?: any } | null;
  subscriptionType?: { name: string; kind?: any } | null;
  types: IntrospectionSchema['types'];
}

export type IntrospectionData =
  | IntrospectionQuery
  | { __schema: PartialIntrospectionSchema };

export interface SchemaTypes {
  query: SchemaObject;
  mutation: SchemaObject | undefined;
  subscription: SchemaObject | undefined;
  [typename: string]: SchemaObject | SchemaUnion | undefined;
}

export const buildClientSchema = (data: IntrospectionData): SchemaTypes => {
  const { __schema } = data;

  const buildNameMap = <T extends { name: string }>(
    arr: ReadonlyArray<T>
  ): { [name: string]: T } => {
    const map: Record<string, T> = {};
    for (let i = 0; arr && i < arr.length; i++) map[arr[i].name] = arr[i];
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
          interfaces: buildNameMap(type.interfaces),
          fields: buildNameMap(type.fields),
        } as SchemaObject;
      case 'UNION':
        return {
          name: type.name,
          kind: type.kind as 'UNION',
          types: buildNameMap(type.possibleTypes),
        } as SchemaUnion;
    }
  };

  const types: SchemaTypes = {} as any;
  for (let i = 0; i < __schema.types.length; i++) {
    const type = __schema.types[i];
    if (type && type.name) {
      const out = buildType(type);
      if (out) types[type.name] = out;
    }
  }

  types.query = types[__schema.queryType.name] as SchemaObject;
  if (__schema.mutationType)
    types.mutation = types[__schema.mutationType.name] as SchemaObject;
  if (__schema.subscriptionType)
    types.subscription = types[__schema.subscriptionType.name] as SchemaObject;

  return types;
};

export const isSubtype = (
  types: SchemaTypes,
  concreteTypename: string,
  relatedTypename: string
): boolean => {
  const concreteType = types[concreteTypename];
  const relatedType = types[relatedTypename];
  if (!concreteType || !relatedType || concreteTypename === relatedTypename) {
    return false;
  } else if (relatedType.kind === 'UNION') {
    return !!relatedType.types[concreteTypename];
  } else if (concreteType.kind === 'UNION') {
    for (const memberTypename in concreteType.types)
      if (!isSubtype(types, memberTypename, relatedTypename)) return false;
    return true;
  } else {
    return !!concreteType.interfaces[relatedTypename];
  }
};
