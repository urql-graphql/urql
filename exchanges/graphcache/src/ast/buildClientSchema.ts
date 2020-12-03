import {
  isUnionType,
  isInterfaceType,
  isObjectType,
  IntrospectionField,
  IntrospectionQuery,
  IntrospectionInputValue,
  IntrospectionNamedTypeRef,
  IntrospectionTypeRef,
  IntrospectionType,
  GraphQLAbstractType,
  GraphQLNamedType,
  GraphQLUnionType,
  GraphQLInterfaceType,
  GraphQLInputFieldConfig,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLType,
} from 'graphql';

interface InterfaceRefs {
  objects: GraphQLObjectType[];
  interfaces: GraphQLInterfaceType[];
}

export interface SchemaIntrospector {
  query: GraphQLObjectType | undefined;
  mutation: GraphQLObjectType | undefined;
  subscription: GraphQLObjectType | undefined;
  types: Record<string, GraphQLNamedType>;
  isSubType(
    abstract: GraphQLAbstractType,
    possible: GraphQLObjectType
  ): boolean;
}

export const buildClientSchema = ({
  __schema,
}: IntrospectionQuery): SchemaIntrospector => {
  const typemap: Record<string, GraphQLNamedType> = {};
  const implementations: Record<string, InterfaceRefs> = {};
  const subTypeCache: Record<string, Record<string, GraphQLObjectType>> = {};

  const getImplementations = (iface: GraphQLInterfaceType): InterfaceRefs =>
    implementations[iface.name] ||
    (implementations[iface.name] = {
      objects: [],
      interfaces: [],
    });

  /** NOTE: This type is used to replace all scalars, since no exact scalar is used in Graphcache. */
  const _any = (typemap._any = new GraphQLScalarType({ name: 'Any' }));

  const getNamedType = (
    ref: string | IntrospectionNamedTypeRef
  ): GraphQLNamedType => typemap[(ref as any).name || ref];

  const getType = (ref: IntrospectionTypeRef): GraphQLType => {
    if (ref.kind === 'LIST') {
      return new GraphQLList(getType(ref.ofType));
    } else if (ref.kind === 'NON_NULL') {
      return new GraphQLNonNull(getType(ref.ofType));
    } else {
      // return getNamedType(ref);
      return _any;
    }
  };

  const buildNameMap = <T extends { name: string }>(
    arr: ReadonlyArray<T>
  ): { [name: string]: T } => {
    const map: Record<string, T> = {};
    for (let i = 0; i < arr.length; i++) map[arr[i].name] = arr[i];
    return map;
  };

  const buildInputValue = (
    input: IntrospectionInputValue
  ): GraphQLInputFieldConfig => {
    const type = getType(input.type) as any;
    return {
      type,
      /*
      NOTE: Not needed for Graphcache's purposes
      defaultValue: input.defaultValue
        ? valueFromAST(parseValue(input.defaultValue), type as any)
        : undefined,
      */
    };
  };

  const buildField = (field: IntrospectionField): any => ({
    name: field.name,
    type: getType(field.type) as any,
    args: buildNameMap(field.args.map(buildInputValue) as any),
  });

  const buildType = (type: IntrospectionType): GraphQLNamedType | void => {
    switch (type.kind) {
      /*
      NOTE: All input/output type values are replaced with the "Any" scalar.
      case 'SCALAR':
        return new GraphQLScalarType({ name: type.name }));
      case 'ENUM':
        return new GraphQLEnumType({
          name: type.name,
          values: buildNameMap(type.enumValues.map(value => ({ name: value.name })) as any),
        } as any);
      case 'INPUT_OBJECT':
        return new GraphQLInputObjectType({
          name: type.name,
          fields: () =>
            buildNameMap(type.inputFields.map(buildInputValue) as any),
        } as any);
      */
      case 'OBJECT':
        return new GraphQLObjectType({
          name: type.name,
          interfaces: () =>
            (type.interfaces || []).map(getNamedType) as GraphQLInterfaceType[],
          fields: () => buildNameMap(type.fields.map(buildField) as any),
        } as any);
      case 'INTERFACE':
        return new GraphQLInterfaceType({
          name: type.name,
          interfaces: () =>
            (type.interfaces || []).map(getNamedType) as GraphQLInterfaceType[],
          fields: () => buildNameMap(type.fields.map(buildField)),
        } as any);
      case 'UNION':
        return new GraphQLUnionType({
          name: type.name,
          types: () =>
            (type.possibleTypes || []).map(getNamedType) as GraphQLObjectType[],
        });
    }
  };

  for (let i = 0; i < __schema.types.length; i++) {
    const type = __schema.types[i];
    if (type && type.name) {
      const out = buildType(type);
      if (out) typemap[type.name] = out;
    }
  }

  for (const key in typemap) {
    const type = typemap[key];
    if (isInterfaceType(type)) {
      const ifaces = type.getInterfaces();
      for (let i = 0; i < ifaces.length; i++)
        getImplementations(ifaces[i]).interfaces.push(type);
    } else if (isObjectType(type)) {
      const ifaces = type.getInterfaces();
      for (let i = 0; i < ifaces.length; i++)
        getImplementations(ifaces[i]).objects.push(type);
    }
  }

  return {
    query: (__schema.queryType &&
      (getNamedType(__schema.queryType.name) as GraphQLObjectType))!,
    mutation: (__schema.mutationType &&
      (getNamedType(__schema.mutationType.name) as GraphQLObjectType))!,
    subscription: (__schema.subscriptionType &&
      (getNamedType(__schema.subscriptionType.name) as GraphQLObjectType))!,
    types: typemap,
    isSubType(abstract: GraphQLAbstractType, possible: GraphQLObjectType) {
      let map = subTypeCache[abstract.name];
      if (map === undefined) {
        if (isUnionType(abstract)) {
          map = buildNameMap(abstract.getTypes());
        } else {
          const implementations = getImplementations(abstract);
          map = Object.assign(
            buildNameMap(implementations.objects),
            buildNameMap(implementations.interfaces)
          );
        }

        subTypeCache[abstract.name] = map;
      }

      return !!map[possible.name];
    },
  };
};
