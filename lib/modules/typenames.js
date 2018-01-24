"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addTypenameToDocument = addTypenameToDocument;
exports.formatTypeNames = formatTypeNames;
exports.gankTypeNamesFromResponse = gankTypeNamesFromResponse;

var _graphql = require("graphql");

const TYPENAME_FIELD = {
  kind: 'Field',
  name: {
    kind: 'Name',
    value: '__typename'
  }
};

function addTypename(selectionSet, isRoot = false) {
  if (selectionSet.selections) {
    if (!isRoot) {
      const exists = selectionSet.selections.some(selection => {
        return selection.kind === 'Field' && selection.name.value === '__typename';
      });

      if (!exists) {
        selectionSet.selections.push(TYPENAME_FIELD);
      }
    }

    selectionSet.selections.forEach(selection => {
      if (selection.kind === 'Field') {
        if (selection.name.value.lastIndexOf('__', 0) !== 0 && selection.selectionSet) {
          addTypename(selection.selectionSet);
        }
      } else if (selection.kind === 'InlineFragment') {
        if (selection.selectionSet) {
          addTypename(selection.selectionSet);
        }
      }
    });
  }
}

function addTypenameToDocument(doc) {
  doc.definitions.forEach(definition => {
    const isRoot = definition.kind === 'OperationDefinition';
    addTypename(definition.selectionSet, isRoot);
  });
  return doc;
}

function formatTypeNames(query) {
  const doc = (0, _graphql.parse)(query.query);
  return {
    query: (0, _graphql.print)(addTypenameToDocument(doc)),
    variables: query.variables
  };
}

function gankTypeNamesFromResponse(response) {
  let typeNames = [];
  getTypeNameFromField(response, typeNames);
  return typeNames.filter((v, i, a) => a.indexOf(v) === i);
}

function getTypeNameFromField(obj, typenames) {
  Object.keys(obj).map(item => {
    if (typeof obj[item] === 'object') {
      if ('__typename' in obj[item]) {
        typenames.push(obj[item].__typename);
      }

      getTypeNameFromField(obj[item], typenames);
    }
  });
}