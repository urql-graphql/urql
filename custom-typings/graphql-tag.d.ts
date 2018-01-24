declare module 'graphql-tag' {
  import { DocumentNode } from 'graphql';
  export default function gql(
    literals: TemplateStringsArray,
    ...placeholders: Array<string>
  ): DocumentNode;
}
