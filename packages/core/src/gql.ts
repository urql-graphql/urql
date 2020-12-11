/* eslint-disable prefer-rest-params */
import { TypedDocumentNode } from '@graphql-typed-document-node/core';

import {
  Source,
  DocumentNode,
  DefinitionNode,
  FragmentDefinitionNode,
  Location,
  Kind,
  print,
} from 'graphql';

import { keyDocument, stringifyDocument } from './utils';

type WritableDocumentNode = {
  -readonly [K in keyof DocumentNode]: DocumentNode[K];
};

const applyDefinitions = (
  fragmentNames: Map<string, string>,
  target: DefinitionNode[],
  source: Array<DefinitionNode> | ReadonlyArray<DefinitionNode>
) => {
  for (let i = 0; i < source.length; i++) {
    const definition = source[i];
    if (source[i].kind === Kind.FRAGMENT_DEFINITION) {
      const name = (source[i] as FragmentDefinitionNode).name.value;
      const value = stringifyDocument(definition);
      // Fragments will be deduplicated according to this Map
      const prevValue = fragmentNames.get(name);
      if (prevValue === undefined) {
        fragmentNames.set(name, value);
        target.push(source[i]);
      } else if (process.env.NODE_ENV !== 'production' && prevValue !== value) {
        // Fragments with the same names is expected to have the same contents
        console.warn(
          '[WARNING: Duplicate Fragment] A fragment with name `' +
            name +
            '` already exists in this document.\n' +
            'While fragment names may not be unique across your source, each name must be unique per document.'
        );
      }
    } else {
      target.push(source[i]);
    }
  }
};

function gql<Data = any, Variables = object>(
  strings: TemplateStringsArray,
  ...interpolations: Array<TypedDocumentNode | DocumentNode | string>
): TypedDocumentNode<Data, Variables>;

function gql<Data = any, Variables = object>(
  string: string
): TypedDocumentNode<Data, Variables>;

function gql(/* arguments */) {
  const fragmentNames = new Map<string, string>();
  const definitions: DefinitionNode[] = [];
  const interpolations: DocumentNode[] = [];

  // Apply the entire tagged template body's definitions
  let body: string = Array.isArray(arguments[0])
    ? arguments[0][0]
    : arguments[0] || '';
  for (let i = 1; i < arguments.length; i++) {
    const value = arguments[i];
    if (value && value.kind === Kind.DOCUMENT) {
      interpolations.push(value);
    } else {
      body += value;
    }

    body += arguments[0][i];
  }

  // Apply the tag's body definitions
  applyDefinitions(fragmentNames, definitions, keyDocument(body).definitions);

  // Copy over each interpolated document's definitions
  for (let i = 0; i < interpolations.length; i++)
    applyDefinitions(fragmentNames, definitions, interpolations[i].definitions);

  const doc: WritableDocumentNode = {
    kind: Kind.DOCUMENT,
    definitions,
    loc: undefined,
  };

  const str = print(doc);
  doc.loc = { start: 0, end: str.length, source: new Source(str) } as Location;

  // Add source for compatibility with graphql-tag, which keyDocument() will also reuse for hashing
  return keyDocument(doc);
}

export { gql };
