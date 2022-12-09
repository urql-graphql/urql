import {
  Location,
  DefinitionNode,
  DocumentNode,
  Kind,
  parse,
  print,
} from 'graphql';

import { HashValue, phash } from './hash';
import { stringifyVariables } from './stringifyVariables';
import { TypedDocumentNode, AnyVariables, GraphQLRequest } from '../types';

interface WritableLocation {
  loc: Location | undefined;
}

export interface KeyedDocumentNode extends DocumentNode {
  __key: HashValue;
}

const SOURCE_NAME = 'gql';
const GRAPHQL_STRING_RE = /("{3}[\s\S]*"{3}|"(?:\\.|[^"])*")/g;
const REPLACE_CHAR_RE = /(#[^\n\r]+)?(?:\n|\r\n?|$)+/g;

const replaceOutsideStrings = (str: string, idx: number) =>
  idx % 2 === 0 ? str.replace(REPLACE_CHAR_RE, '\n') : str;

const sanitizeDocument = (node: string): string =>
  node.split(GRAPHQL_STRING_RE).map(replaceOutsideStrings).join('').trim();

const prints = new Map<DocumentNode | DefinitionNode, string>();
const docs = new Map<HashValue, KeyedDocumentNode>();

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

const hashDocument = (
  node: string | DefinitionNode | DocumentNode
): HashValue => {
  let key = phash(stringifyDocument(node));
  // Add the operation name to the produced hash
  if (typeof node === 'object' && 'definitions' in node) {
    const operationName = getOperationName(node);
    if (operationName) key = phash(`\n# ${operationName}`, key);
  }
  return key;
};

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

export const createRequest = <
  Data = any,
  Variables extends AnyVariables = AnyVariables
>(
  q: string | DocumentNode | TypedDocumentNode<Data, Variables>,
  variables: Variables
): GraphQLRequest<Data, Variables> => {
  if (!variables) variables = {} as Variables;
  const query = keyDocument(q);
  const printedVars = stringifyVariables(variables);
  let key = query.__key;
  if (printedVars !== '{}') key = phash(printedVars, key);
  return { key, query, variables };
};

/**
 * Finds the Name value from the OperationDefinition of a Document
 */
export const getOperationName = (query: DocumentNode): string | undefined => {
  for (const node of query.definitions) {
    if (node.kind === Kind.OPERATION_DEFINITION && node.name) {
      return node.name.value;
    }
  }
};

/**
 * Finds the operation-type
 */
export const getOperationType = (query: DocumentNode): string | undefined => {
  for (const node of query.definitions) {
    if (node.kind === Kind.OPERATION_DEFINITION) {
      return node.operation;
    }
  }
};
