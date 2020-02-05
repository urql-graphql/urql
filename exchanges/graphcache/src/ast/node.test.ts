import { unwrapType } from './';
import { GraphQLScalarType, GraphQLNonNull, GraphQLList } from 'graphql';

describe('unwrapType', () => {
  it('Should return the type if not wrapped', () => {
    const type = new GraphQLScalarType({
      name: 'String',
      serialize: () => null,
    });

    expect(unwrapType(type)).toBe(type);
  });

  it('Should unwrap non-nullable types', () => {
    const scalar = new GraphQLScalarType({
      name: 'MyScalar',
      serialize: () => null,
    });
    const type = new GraphQLNonNull(scalar);

    expect(unwrapType(type)).toBe(scalar);
  });

  it('Should unwrap list types', () => {
    const scalar = new GraphQLScalarType({
      name: 'MyScalar',
      serialize: () => null,
    });
    const type = new GraphQLList(scalar);

    expect(unwrapType(type)).toBe(scalar);
  });

  it('Should unwrap nested types', () => {
    const scalar = new GraphQLScalarType({
      name: 'MyScalar',
      serialize: () => null,
    });

    const nonNullList = new GraphQLNonNull(scalar);

    const type = new GraphQLList(nonNullList);

    expect(unwrapType(type)).toBe(scalar);
  });
});
