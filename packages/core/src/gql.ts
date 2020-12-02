import { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { Source, Location, DocumentNode, Kind, print } from 'graphql';
import { keyDocument } from './utils';

type WritableDocumentNode = {
  -readonly [K in keyof DocumentNode]: DocumentNode[K]
};

function gql<Data = any, Variables = object>(
  strings: TemplateStringsArray,
  ...interpolations: Array<TypedDocumentNode | DocumentNode | string>
): TypedDocumentNode<Data, Variables>;

function gql<Data = any, Variables = object>(string: string): TypedDocumentNode<Data, Variables>;

function gql(/* arguments */) {
  let body = Array.isArray(arguments[0]) ? arguments[0][0] : (arguments[0] || '');
  for (let i = 1; i < arguments.length; i++) {
    const value = arguments[i];
    body +=
      value && value.kind === Kind.DOCUMENT
        ? (value.loc ? value.loc.source.body : print(value))
        : value;
    body += arguments[0][i];
  }

  const doc = keyDocument(body);
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

  (doc as WritableDocumentNode).loc = {
    start: 0,
    end: body.length,
    source: new Source(body, 'gql'),
  } as Location;

  return doc;
}

export { gql };
