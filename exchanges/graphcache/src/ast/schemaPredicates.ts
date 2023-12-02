import type {
  InlineFragmentNode,
  FragmentDefinitionNode,
} from '@0no-co/graphql.web';

import { warn, invariant } from '../helpers/help';
import { getTypeCondition } from './node';
import type { SchemaIntrospector, SchemaObject } from './schema';

import type {
  KeyingConfig,
  UpdatesConfig,
  ResolverConfig,
  OptimisticMutationConfig,
  Logger,
} from '../types';

const BUILTIN_NAME = '__';

export const isFieldNullable = (
  schema: SchemaIntrospector,
  typename: string,
  fieldName: string,
  logger: Logger | undefined
): boolean => {
  const field = getField(schema, typename, fieldName, logger);
  return !!field && field.type.kind !== 'NON_NULL';
};

export const isListNullable = (
  schema: SchemaIntrospector,
  typename: string,
  fieldName: string,
  logger: Logger | undefined
): boolean => {
  const field = getField(schema, typename, fieldName, logger);
  if (!field) return false;
  const ofType =
    field.type.kind === 'NON_NULL' ? field.type.ofType : field.type;
  return ofType.kind === 'LIST' && ofType.ofType.kind !== 'NON_NULL';
};

export const isFieldAvailableOnType = (
  schema: SchemaIntrospector,
  typename: string,
  fieldName: string,
  logger: Logger | undefined
): boolean =>
  fieldName.indexOf(BUILTIN_NAME) === 0 ||
  typename.indexOf(BUILTIN_NAME) === 0 ||
  !!getField(schema, typename, fieldName, logger);

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
    schema.types!.has(typeCondition) &&
    schema.types!.get(typeCondition)!.kind === 'OBJECT'
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
  fieldName: string,
  logger: Logger | undefined
) => {
  if (
    fieldName.indexOf(BUILTIN_NAME) === 0 ||
    typename.indexOf(BUILTIN_NAME) === 0
  )
    return;

  expectObjectType(schema, typename);
  const object = schema.types!.get(typename) as SchemaObject;
  const field = object.fields()[fieldName];
  if (!field) {
    warn(
      'Invalid field: The field `' +
        fieldName +
        '` does not exist on `' +
        typename +
        '`, ' +
        'but the GraphQL document expects it to exist.\n' +
        'Traversal will continue, however this may lead to undefined behavior!',
      4,
      logger
    );
  }

  return field;
};

function expectObjectType(schema: SchemaIntrospector, typename: string) {
  invariant(
    schema.types!.has(typename) &&
      schema.types!.get(typename)!.kind === 'OBJECT',
    'Invalid Object type: The type `' +
      typename +
      '` is not an object in the defined schema, ' +
      'but the GraphQL document is traversing it.',
    3
  );
}

function expectAbstractType(schema: SchemaIntrospector, typename: string) {
  invariant(
    schema.types!.has(typename) &&
      (schema.types!.get(typename)!.kind === 'INTERFACE' ||
        schema.types!.get(typename)!.kind === 'UNION'),
    'Invalid Abstract type: The type `' +
      typename +
      '` is not an Interface or Union type in the defined schema, ' +
      'but a fragment in the GraphQL document is using it as a type condition.',
    5
  );
}

export function expectValidKeyingConfig(
  schema: SchemaIntrospector,
  keys: KeyingConfig,
  logger: Logger | undefined
): void {
  if (process.env.NODE_ENV !== 'production') {
    for (const key in keys) {
      if (!schema.types!.has(key)) {
        warn(
          'Invalid Object type: The type `' +
            key +
            '` is not an object in the defined schema, but the `keys` option is referencing it.',
          20,
          logger
        );
      }
    }
  }
}

export function expectValidUpdatesConfig(
  schema: SchemaIntrospector,
  updates: UpdatesConfig,
  logger: Logger | undefined
): void {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  for (const typename in updates) {
    if (!updates[typename]) {
      continue;
    } else if (!schema.types!.has(typename)) {
      let addition = '';

      if (
        typename === 'Mutation' &&
        schema.mutation &&
        schema.mutation !== 'Mutation'
      ) {
        addition +=
          '\nMaybe your config should reference `' + schema.mutation + '`?';
      } else if (
        typename === 'Subscription' &&
        schema.subscription &&
        schema.subscription !== 'Subscription'
      ) {
        addition +=
          '\nMaybe your config should reference `' + schema.subscription + '`?';
      }

      return warn(
        'Invalid updates type: The type `' +
          typename +
          '` is not an object in the defined schema, but the `updates` config is referencing it.' +
          addition,
        21,
        logger
      );
    }

    const fields = (schema.types!.get(typename)! as SchemaObject).fields();
    for (const fieldName in updates[typename]!) {
      if (!fields[fieldName]) {
        warn(
          'Invalid updates field: `' +
            fieldName +
            '` on `' +
            typename +
            '` is not in the defined schema, but the `updates` config is referencing it.',
          22,
          logger
        );
      }
    }
  }
}

function warnAboutResolver(name: string, logger: Logger | undefined): void {
  warn(
    `Invalid resolver: \`${name}\` is not in the defined schema, but the \`resolvers\` option is referencing it.`,
    23,
    logger
  );
}

function warnAboutAbstractResolver(
  name: string,
  kind: 'UNION' | 'INTERFACE',
  logger: Logger | undefined
): void {
  warn(
    `Invalid resolver: \`${name}\` does not match to a concrete type in the schema, but the \`resolvers\` option is referencing it. Implement the resolver for the types that ${
      kind === 'UNION' ? 'make up the union' : 'implement the interface'
    } instead.`,
    26,
    logger
  );
}

export function expectValidResolversConfig(
  schema: SchemaIntrospector,
  resolvers: ResolverConfig,
  logger: Logger | undefined
): void {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  for (const key in resolvers) {
    if (key === 'Query') {
      if (schema.query) {
        const validQueries = (
          schema.types!.get(schema.query) as SchemaObject
        ).fields();
        for (const resolverQuery in resolvers.Query || {}) {
          if (!validQueries[resolverQuery]) {
            warnAboutResolver('Query.' + resolverQuery, logger);
          }
        }
      } else {
        warnAboutResolver('Query', logger);
      }
    } else {
      if (!schema.types!.has(key)) {
        warnAboutResolver(key, logger);
      } else if (
        schema.types!.get(key)!.kind === 'INTERFACE' ||
        schema.types!.get(key)!.kind === 'UNION'
      ) {
        warnAboutAbstractResolver(
          key,
          schema.types!.get(key)!.kind as 'INTERFACE' | 'UNION',
          logger
        );
      } else {
        const validTypeProperties = (
          schema.types!.get(key) as SchemaObject
        ).fields();
        for (const resolverProperty in resolvers[key] || {}) {
          if (!validTypeProperties[resolverProperty]) {
            warnAboutResolver(key + '.' + resolverProperty, logger);
          }
        }
      }
    }
  }
}

export function expectValidOptimisticMutationsConfig(
  schema: SchemaIntrospector,
  optimisticMutations: OptimisticMutationConfig,
  logger: Logger | undefined
): void {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  if (schema.mutation) {
    const validMutations = (
      schema.types!.get(schema.mutation) as SchemaObject
    ).fields();
    for (const mutation in optimisticMutations) {
      if (!validMutations[mutation]) {
        warn(
          `Invalid optimistic mutation field: \`${mutation}\` is not a mutation field in the defined schema, but the \`optimistic\` option is referencing it.`,
          24,
          logger
        );
      }
    }
  }
}
