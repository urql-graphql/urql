import type { IntrospectionQuery, GraphQLSchema } from 'graphql';
import { parse, buildSchema, execute, getIntrospectionQuery } from 'graphql';

/** Returns an {@link IntrospectionQuery} result for a given GraphQL schema.
 *
 * @param input - A GraphQL schema, either as an SDL string, or a {@link GraphQLSchema} object.
 * @returns an {@link IntrospectionQuery} result.
 *
 * @remarks
 * `getIntrospectedSchema` can be used to get a Schema Introspection result from
 * a given GraphQL schema. The schema can be passed as an SDL string or a
 * {@link GraphQLSchema} object. If an {@link IntrospectionQuery} object is
 * passed, it'll be passed through.
 *
 * @throws
 * If `input` cannot be parsed or converted into a {@link GraphQLSchema} then
 * a {@link TypeError} will be thrown.
 */
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

  const initialIntrospection: any = execute({
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
