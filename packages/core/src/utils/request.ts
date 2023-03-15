import {
  Location,
  DefinitionNode,
  DocumentNode,
  Kind,
  parse,
  print,
} from 'graphql';

import { HashValue, phash } from './hash';
import { stringifyVariables } from './variables';
import { TypedDocumentNode, AnyVariables, GraphQLRequest } from '../types';

interface WritableLocation {
  loc: Location | undefined;
}

/** A `DocumentNode` annotated with its hashed key.
 * @internal
 */
export interface KeyedDocumentNode extends DocumentNode {
  __key: HashValue;
}

const SOURCE_NAME = 'gql';
const GRAPHQL_STRING_RE = /("{3}[\s\S]*"{3}|"(?:\\.|[^"])*")/g;
const REPLACE_CHAR_RE = /(?:#[^\n\r]+)?(?:[\r\n]+|$)/g;

const replaceOutsideStrings = (str: string, idx: number) =>
  idx % 2 === 0 ? str.replace(REPLACE_CHAR_RE, '\n') : str;

/** Sanitizes a GraphQL document string by replacing comments and redundant newlines in it. */
const sanitizeDocument = (node: string): string =>
  node.split(GRAPHQL_STRING_RE).map(replaceOutsideStrings).join('').trim();

const prints = new Map<DocumentNode | DefinitionNode, string>();
const docs = new Map<HashValue, KeyedDocumentNode>();

/** A cached printing function for GraphQL documents.
 *
 * @param node - A string of a document or a {@link DocumentNode}
 * @returns A normalized printed string of the passed GraphQL document.
 *
 * @remarks
 * This function accepts a GraphQL query string or {@link DocumentNode},
 * then prints and sanitizes it. The sanitizer takes care of removing
 * comments, which otherwise alter the key of the document although the
 * document is otherwise equivalent to another.
 *
 * When a {@link DocumentNode} is passed to this function, it caches its
 * output by modifying the `loc.source.body` property on the GraphQL node.
 */
export const stringifyDocument = (
  node: string | DefinitionNode | DocumentNode
): string => {
  let printed: string;
  if (typeof node === 'string') {
    printed = sanitizeDocument(node);
  } else if (node.loc && docs.get((node as KeyedDocumentNode).__key) === node) {
    printed = node.loc.source.body;
  } else {
    printed = prints.get(node) || sanitizeDocument(print(node));
    prints.set(node, printed);
  }

  if (typeof node !== 'string' && !node.loc) {
    (node as WritableLocation).loc = {
      start: 0,
      end: printed.length,
      source: {
        body: printed,
        name: SOURCE_NAME,
        locationOffset: { line: 1, column: 1 },
      },
    } as Location;
  }

  return printed;
};

/** Computes the hash for a document's string using {@link stringifyDocument}'s output.
 *
 * @param node - A string of a document or a {@link DocumentNode}
 * @returns A {@link HashValue}
 *
 * @privateRemarks
 * This function adds the operation name of the document to the hash, since sometimes
 * a merged document with multiple operations may be used. Although `urql` requires a
 * `DocumentNode` to only contain a single operation, when the cached `loc.source.body`
 * of a `DocumentNode` is used, this string may still contain multiple operations and
 * the resulting hash should account for only one at a time.
 */
const hashDocument = (
  node: string | DefinitionNode | DocumentNode
): HashValue => {
  let key = phash(stringifyDocument(node));
  // Add the operation name to the produced hash
  if ((node as DocumentNode).definitions) {
    const operationName = getOperationName(node as DocumentNode);
    if (operationName) key = phash(`\n# ${operationName}`, key);
  }
  return key;
};

/** Returns a canonical version of the passed `DocumentNode` with an added hash key.
 *
 * @param node - A string of a document or a {@link DocumentNode}
 * @returns A {@link KeyedDocumentNode}
 *
 * @remarks
 * `urql` will always avoid unnecessary work, no matter whether a user passes `DocumentNode`s
 * or strings of GraphQL documents to its APIs.
 *
 * This function will return a canonical version of a {@link KeyedDocumentNode} no matter
 * which kind of input is passed, avoiding parsing or hashing of passed data as needed.
 */
export const keyDocument = (node: string | DocumentNode): KeyedDocumentNode => {
  let key: HashValue;
  let query: DocumentNode;
  if (typeof node === 'string') {
    key = hashDocument(node);
    query = docs.get(key) || parse(node, { noLocation: true });
  } else {
    key = (node as KeyedDocumentNode).__key || hashDocument(node);
    query = docs.get(key) || node;
  }

  // Add location information if it's missing
  if (!query.loc) stringifyDocument(query);

  (query as KeyedDocumentNode).__key = key;
  docs.set(key, query as KeyedDocumentNode);
  return query as KeyedDocumentNode;
};

/** Creates a `GraphQLRequest` from the passed parameters.
 *
 * @param q - A string of a document or a {@link DocumentNode}
 * @param variables - A variables object for the defined GraphQL operation.
 * @returns A {@link GraphQLRequest}
 *
 * @remarks
 * `createRequest` creates a {@link GraphQLRequest} from the passed parameters,
 * while replacing the document as needed with a canonical version of itself,
 * to avoid parsing, printing, or hashing the same input multiple times.
 *
 * If no variables are passed, canonically it'll default to an empty object,
 * which is removed from the resulting hash key.
 */
export const createRequest = <
  Data = any,
  Variables extends AnyVariables = AnyVariables
>(
  _query: string | DocumentNode | TypedDocumentNode<Data, Variables>,
  _variables: Variables,
  extensions?: Record<string, any> | undefined
): GraphQLRequest<Data, Variables> => {
  const variables = _variables || ({} as Variables);
  const query = keyDocument(_query);
  const printedVars = stringifyVariables(variables);
  let key = query.__key;
  if (printedVars !== '{}') key = phash(printedVars, key);
  return { key, query, variables, extensions };
};

/** Returns the name of the `DocumentNode`'s operation, if any.
 * @param query - A {@link DocumentNode}
 * @returns the operation's name contained within the document, or `undefined`
 */
export const getOperationName = (query: DocumentNode): string | undefined => {
  for (const node of query.definitions) {
    if (node.kind === Kind.OPERATION_DEFINITION && node.name) {
      return node.name.value;
    }
  }
};

/** Returns the type of the `DocumentNode`'s operation, if any.
 * @param query - A {@link DocumentNode}
 * @returns the operation's type contained within the document, or `undefined`
 */
export const getOperationType = (query: DocumentNode): string | undefined => {
  for (const node of query.definitions) {
    if (node.kind === Kind.OPERATION_DEFINITION) {
      return node.operation;
    }
  }
};
