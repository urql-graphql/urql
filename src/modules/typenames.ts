import { DocumentNode, FieldNode, SelectionSetNode } from 'graphql';

import { visit } from 'graphql/language';
import { parse } from 'graphql/language/parser';
import { print } from 'graphql/language/printer';

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

export function gankTypeNamesFromResponse(response: object) {
  const typeNames = [];
  getTypeNameFromField(response, typeNames);
  return typeNames.filter((v, i, a) => a.indexOf(v) === i);
}

function getTypeNameFromField(obj: object, typenames: string[]) {
  Object.keys(obj).map(item => {
    if (typeof obj[item] === 'object') {
      if (obj[item] && '__typename' in obj[item]) {
        typenames.push(obj[item].__typename);
      }
      if (obj[item]) {
        getTypeNameFromField(obj[item], typenames);
      }
    }
  });
}
