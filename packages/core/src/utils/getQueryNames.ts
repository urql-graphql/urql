import { parse, DocumentNode, visit } from 'graphql';

export const getQueryNames = (query: string | DocumentNode) => {
  const document = typeof query === 'string' ? parse(query) : query;
  const names: string[] = [];

  visit(document, {
    OperationDefinition: n => {
      if (n.name) {
        names.push(n.name.value);
      }
      return false; // Don't visit child nodes
    },
  });
  return names;
};
