import {
  IntrospectionQuery,
  GraphQLSchema,
  parse,
  buildSchema,
  executeSync,
  getIntrospectionQuery,
} from 'graphql';

export const getIntrospectedSchema = (
  input: string | IntrospectionQuery | GraphQLSchema
): IntrospectionQuery => {
  if (typeof input === 'string') {
    try {
      input = JSON.parse(input);
    } catch (_error) {
      input = buildSchema(input as string);
    }
  }

  if (typeof input === 'object' && '__schema' in input) {
    return input;
  }

  const initialIntrospection = executeSync({
    document: parse(getIntrospectionQuery({ descriptions: false })),
    schema: input as GraphQLSchema,
  });

  if (!initialIntrospection.data || !initialIntrospection.data.__schema) {
    throw new TypeError(
      'GraphQL could not generate an IntrospectionQuery from the given schema.'
    );
  }

  return initialIntrospection.data as IntrospectionQuery;
};
