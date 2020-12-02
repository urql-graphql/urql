import { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { DocumentNode, Kind, print } from 'graphql';
import { keyDocument } from './utils';

function gql<Data = any, Variables = object>(
  strings: TemplateStringsArray,
  ...interpolations: Array<string | DocumentNode | TypedDocumentNode>
): TypedDocumentNode<Data, Variables>;

function gql<Data = any, Variables = object>(string: string): TypedDocumentNode<Data, Variables>;

function gql(/* arguments */) {
  let result = typeof arguments[0] === 'string' ? arguments[0] : arguments[0][0];
  for (let i = 1; i < arguments.length; i++) {
    const interpolation = arguments[i];
    result +=
      interpolation && interpolation.kind === Kind.DOCUMENT
        ? print(interpolation)
        : interpolation;
    result += arguments[0][i];
  }

  const doc = keyDocument(result);
  if (process.env.NODE_ENV !== 'production') {
    const fragmentNames = new Set();
    for (let i = 0; i < doc.definitions.length; i++) {
      const definition = doc.definitions[i];
      if (definition.kind === Kind.FRAGMENT_DEFINITION) {
        const name = definition.name.value;
        if (fragmentNames.has(name)) {
          console.warn(
            "[WARNING: Duplicate Fragment] A fragment with name `" + name + "` already exists in this document.\n"
            + "While fragment names may not be unique across your source, each name must be unique per document.");
        } else {
          fragmentNames.add(name);
        }
      }
    }
  }

  return doc;
}

export { gql };
