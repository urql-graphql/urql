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

import { warn, invariant } from '../helpers/help';
import {
  KeyingConfig,
  UpdatesConfig,
  ResolverConfig,
  OptimisticMutationConfig,
} from '../types';

const BUILTIN_FIELD_RE = /^__/;

export const isFieldNullable = (
  schema: GraphQLSchema,
  typename: string,
  fieldName: string
): boolean => {
  if (BUILTIN_FIELD_RE.test(fieldName)) return true;
  const field = getField(schema, typename, fieldName);
  return !!field && isNullableType(field.type);
};

export const isListNullable = (
  schema: GraphQLSchema,
  typename: string,
  fieldName: string
): boolean => {
  const field = getField(schema, typename, fieldName);
  if (!field) return false;
  const ofType = isNonNullType(field.type) ? field.type.ofType : field.type;
  return isListType(ofType) && isNullableType(ofType.ofType);
};

export const isFieldAvailableOnType = (
  schema: GraphQLSchema,
  typename: string,
  fieldName: string
): boolean => {
  if (BUILTIN_FIELD_RE.test(fieldName)) return true;
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
  if (!field) {
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

export function expectValidKeyingConfig(
  schema: GraphQLSchema,
  keys: KeyingConfig
): void {
  if (process.env.NODE_ENV !== 'production') {
    const types = Object.keys(schema.getTypeMap());
    Object.keys(keys).forEach(key => {
      if (types.indexOf(key) === -1) {
        warn(
          'Invalid Object type: The type `' +
            key +
            '` is not an object in the defined schema, but the `keys` option is referencing it.',
          20
        );
      }
    });
  }
}

export function expectValidUpdatesConfig(
  schema: GraphQLSchema,
  updates: UpdatesConfig
): void {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  /* eslint-disable prettier/prettier */
  const schemaMutations = schema.getMutationType()
    ? Object.keys((schema.getMutationType() as GraphQLObjectType).toConfig().fields)
    : [];
  const schemaSubscriptions = schema.getSubscriptionType()
    ? Object.keys((schema.getSubscriptionType() as GraphQLObjectType).toConfig().fields)
    : [];
  const givenMutations = updates.Mutation
    ? Object.keys(updates.Mutation)
    : [];
  const givenSubscriptions = updates.Subscription
    ? Object.keys(updates.Subscription)
    : [];
  /* eslint-enable prettier/prettier */

  for (const givenMutation of givenMutations) {
    if (schemaMutations.indexOf(givenMutation) === -1) {
      warn(
        'Invalid mutation field: `' +
          givenMutation +
          '` is not in the defined schema, but the `updates.Mutation` option is referencing it.',
        21
      );
    }
  }

  for (const givenSubscription of givenSubscriptions) {
    if (schemaSubscriptions.indexOf(givenSubscription) === -1) {
      warn(
        'Invalid subscription field: `' +
          givenSubscription +
          '` is not in the defined schema, but the `updates.Subscription` option is referencing it.',
        22
      );
    }
  }
}

function warnAboutResolver(name: string): void {
  warn(
    `Invalid resolver: \`${name}\` is not in the defined schema, but the \`resolvers\` option is referencing it.`,
    23
  );
}

export function expectValidResolversConfig(
  schema: GraphQLSchema,
  resolvers: ResolverConfig
): void {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  const validTypes = Object.keys(schema.getTypeMap());

  for (const key in resolvers) {
    if (key === 'Query') {
      const queryType = schema.getQueryType();
      if (queryType) {
        const validQueries = Object.keys(queryType.toConfig().fields);
        for (const resolverQuery in resolvers.Query) {
          if (validQueries.indexOf(resolverQuery) === -1) {
            warnAboutResolver('Query.' + resolverQuery);
          }
        }
      } else {
        warnAboutResolver('Query');
      }
    } else {
      if (validTypes.indexOf(key) === -1) {
        warnAboutResolver(key);
      } else {
        const validTypeProperties = Object.keys(
          (schema.getType(key) as GraphQLObjectType).getFields()
        );
        const resolverProperties = Object.keys(resolvers[key]);
        for (const resolverProperty of resolverProperties) {
          if (validTypeProperties.indexOf(resolverProperty) === -1) {
            warnAboutResolver(key + '.' + resolverProperty);
          }
        }
      }
    }
  }
}

export function expectValidOptimisticMutationsConfig(
  schema: GraphQLSchema,
  optimisticMutations: OptimisticMutationConfig
): void {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  const validMutations = schema.getMutationType()
    ? Object.keys(
        (schema.getMutationType() as GraphQLObjectType).toConfig().fields
      )
    : [];

  for (const mutation in optimisticMutations) {
    if (validMutations.indexOf(mutation) === -1) {
      warn(
        `Invalid optimistic mutation field: \`${mutation}\` is not a mutation field in the defined schema, but the \`optimistic\` option is referencing it.`,
        24
      );
    }
  }
}
