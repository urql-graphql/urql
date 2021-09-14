import { InlineFragmentNode, FragmentDefinitionNode } from 'graphql';

import { warn, invariant } from '../helpers/help';
import { getTypeCondition } from './node';
import { SchemaIntrospector, SchemaObject } from './schema';

import {
  KeyingConfig,
  UpdateResolver,
  ResolverConfig,
  OptimisticMutationConfig,
} from '../types';

const BUILTIN_NAME = '__';

export const isFieldNullable = (
  schema: SchemaIntrospector,
  typename: string,
  fieldName: string
): boolean => {
  const field = getField(schema, typename, fieldName);
  return !!field && field.type.kind !== 'NON_NULL';
};

export const isListNullable = (
  schema: SchemaIntrospector,
  typename: string,
  fieldName: string
): boolean => {
  const field = getField(schema, typename, fieldName);
  if (!field) return false;
  const ofType =
    field.type.kind === 'NON_NULL' ? field.type.ofType : field.type;
  return ofType.kind === 'LIST' && ofType.ofType.kind !== 'NON_NULL';
};

export const isFieldAvailableOnType = (
  schema: SchemaIntrospector,
  typename: string,
  fieldName: string
): boolean =>
  fieldName.indexOf(BUILTIN_NAME) === 0 ||
  typename.indexOf(BUILTIN_NAME) === 0 ||
  !!getField(schema, typename, fieldName);

export const isInterfaceOfType = (
  schema: SchemaIntrospector,
  node: InlineFragmentNode | FragmentDefinitionNode,
  typename: string | void
): boolean => {
  if (!typename) return false;
  const typeCondition = getTypeCondition(node);
  if (!typeCondition || typename === typeCondition) {
    return true;
  } else if (
    schema.types![typeCondition] &&
    schema.types![typeCondition].kind === 'OBJECT'
  ) {
    return typeCondition === typename;
  }

  expectAbstractType(schema, typeCondition!);
  expectObjectType(schema, typename!);
  return schema.isSubType(typeCondition, typename);
};

const getField = (
  schema: SchemaIntrospector,
  typename: string,
  fieldName: string
) => {
  if (
    fieldName.indexOf(BUILTIN_NAME) === 0 ||
    typename.indexOf(BUILTIN_NAME) === 0
  )
    return;

  expectObjectType(schema, typename);
  const object = schema.types![typename] as SchemaObject;
  const field = object.fields[fieldName];
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

function expectObjectType(schema: SchemaIntrospector, typename: string) {
  invariant(
    schema.types![typename] && schema.types![typename].kind === 'OBJECT',
    'Invalid Object type: The type `' +
      typename +
      '` is not an object in the defined schema, ' +
      'but the GraphQL document is traversing it.',
    3
  );
}

function expectAbstractType(schema: SchemaIntrospector, typename: string) {
  invariant(
    schema.types![typename] &&
      (schema.types![typename].kind === 'INTERFACE' ||
        schema.types![typename].kind === 'UNION'),
    'Invalid Abstract type: The type `' +
      typename +
      '` is not an Interface or Union type in the defined schema, ' +
      'but a fragment in the GraphQL document is using it as a type condition.',
    5
  );
}

export function expectValidKeyingConfig(
  schema: SchemaIntrospector,
  keys: KeyingConfig
): void {
  if (process.env.NODE_ENV !== 'production') {
    for (const key in keys) {
      if (!schema.types![key]) {
        warn(
          'Invalid Object type: The type `' +
            key +
            '` is not an object in the defined schema, but the `keys` option is referencing it.',
          20
        );
      }
    }
  }
}

export function expectValidUpdatesConfig(
  schema: SchemaIntrospector,
  updates: Record<string, Record<string, UpdateResolver | undefined>>
): void {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  if (schema.mutation) {
    const mutationFields = (schema.types![schema.mutation] as SchemaObject)
      .fields;
    const givenMutations = updates[schema.mutation] || {};
    for (const fieldName in givenMutations) {
      if (mutationFields[fieldName] === undefined) {
        warn(
          'Invalid mutation field: `' +
            fieldName +
            '` is not in the defined schema, but the `updates.Mutation` option is referencing it.',
          21
        );
      }
    }
  }

  if (schema.subscription) {
    const subscriptionFields = (schema.types![
      schema.subscription
    ] as SchemaObject).fields;
    const givenSubscription = updates[schema.subscription] || {};
    for (const fieldName in givenSubscription) {
      if (subscriptionFields[fieldName] === undefined) {
        warn(
          'Invalid subscription field: `' +
            fieldName +
            '` is not in the defined schema, but the `updates.Subscription` option is referencing it.',
          22
        );
      }
    }
  }
}

function warnAboutResolver(name: string): void {
  warn(
    `Invalid resolver: \`${name}\` is not in the defined schema, but the \`resolvers\` option is referencing it.`,
    23
  );
}

function warnAboutAbstractResolver(
  name: string,
  kind: 'UNION' | 'INTERFACE'
): void {
  warn(
    `Invalid resolver: \`${name}\` does not match to a concrete type in the schema, but the \`resolvers\` option is referencing it. Implement the resolver for the types that ${
      kind === 'UNION' ? 'make up the union' : 'implement the interface'
    } instead.`,
    26
  );
}

export function expectValidResolversConfig(
  schema: SchemaIntrospector,
  resolvers: ResolverConfig
): void {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  for (const key in resolvers) {
    if (key === 'Query') {
      if (schema.query) {
        const validQueries = (schema.types![schema.query] as SchemaObject)
          .fields;
        for (const resolverQuery in resolvers.Query) {
          if (!validQueries[resolverQuery]) {
            warnAboutResolver('Query.' + resolverQuery);
          }
        }
      } else {
        warnAboutResolver('Query');
      }
    } else {
      if (!schema.types![key]) {
        warnAboutResolver(key);
      } else if (
        schema.types![key].kind === 'INTERFACE' ||
        schema.types![key].kind === 'UNION'
      ) {
        warnAboutAbstractResolver(
          key,
          schema.types![key].kind as 'INTERFACE' | 'UNION'
        );
      } else {
        const validTypeProperties = (schema.types![key] as SchemaObject).fields;
        for (const resolverProperty in resolvers[key]) {
          if (!validTypeProperties[resolverProperty]) {
            warnAboutResolver(key + '.' + resolverProperty);
          }
        }
      }
    }
  }
}

export function expectValidOptimisticMutationsConfig(
  schema: SchemaIntrospector,
  optimisticMutations: OptimisticMutationConfig
): void {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  if (schema.mutation) {
    const validMutations = (schema.types![schema.mutation] as SchemaObject)
      .fields;
    for (const mutation in optimisticMutations) {
      if (!validMutations[mutation]) {
        warn(
          `Invalid optimistic mutation field: \`${mutation}\` is not a mutation field in the defined schema, but the \`optimistic\` option is referencing it.`,
          24
        );
      }
    }
  }
}
