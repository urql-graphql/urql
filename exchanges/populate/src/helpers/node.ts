import {
  NameNode,
  GraphQLOutputType,
  isWrappingType,
  GraphQLWrappingType,
  Kind,
} from 'graphql';

export type GraphQLFlatType = Exclude<GraphQLOutputType, GraphQLWrappingType>;

/** Returns the name of a given node */
export const getName = (node: { name: NameNode }): string => node.name.value;

export const unwrapType = (
  type: null | undefined | GraphQLOutputType
): GraphQLFlatType | null => {
  if (isWrappingType(type)) {
    return unwrapType(type.ofType);
  }

  return type || null;
};

export function createNameNode(value: string): NameNode {
  return {
    kind: Kind.NAME,
    value,
  };
}
