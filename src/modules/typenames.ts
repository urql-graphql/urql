import { DocumentNode, FieldNode, SelectionSetNode } from 'graphql';

import { visit } from 'graphql/language';
import { parse } from 'graphql/language/parser';
import { print } from 'graphql/language/printer';
import { IExecutionData } from '../interfaces/exchange';

import { field, isField, isOperationDefinition, name } from 'graphql-ast-types';
import { IQuery } from '../interfaces/index';

const TYPENAME_FIELD: FieldNode = field(name('__typename'));

function hasTypename(node: SelectionSetNode): boolean {
  return node.selections.some((fieldNode: FieldNode) => {
    if (isField(fieldNode)) {
      return fieldNode.name.value === '__typename';
    }
  });
}

function addTypenameToDocument(doc: DocumentNode) {
  return visit(doc, {
    SelectionSet(node, _, parent) {
      if (!isOperationDefinition(parent) && !hasTypename(node)) {
        node.selections.push(TYPENAME_FIELD);
        return node;
      }
    },
  });
}

export function formatTypeNames(query: IQuery) {
  const doc = parse(query.query);
  return {
    query: print(addTypenameToDocument(doc)),
    variables: query.variables,
  };
}

export function gankTypeNamesFromResponse(response: IExecutionData) {
  const typeNames = [];
  getTypeNameFromField(response, typeNames);
  return typeNames.filter((v, i, a) => a.indexOf(v) === i);
}

function isObject(obj): obj is IExecutionData {
  return obj && typeof obj === 'object';
}

function getTypeNameFromField(obj: IExecutionData, typenames: string[]) {
  Object.keys(obj).map(item => {
    const value = obj[item];
    if (isObject(value)) {
      if (value.__typename) {
        typenames.push(value.__typename);
      }
      getTypeNameFromField(value, typenames);
    }
  });
}
