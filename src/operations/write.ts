import {
  forEachFieldNode,
  getFieldAlias,
  getFragments,
  getMainOperation,
  getSelectionSet,
  normalizeVariables,
  getName,
  getFieldArguments,
} from '../ast';

import {
  NullArray,
  Fragments,
  Variables,
  Data,
  Entity,
  Link,
  Scalar,
  SelectionSet,
  OperationRequest,
} from '../types';

import { joinKeys, keyOfEntity, keyOfField } from '../helpers';
import { Store } from '../store';

export interface WriteResult {
  dependencies: Set<string>;
}

interface Context {
  result: WriteResult;
  store: Store;
  variables: Variables;
  fragments: Fragments;
}

/** Writes a request given its response to the store */
export const write = (
  store: Store,
  request: OperationRequest,
  data: Data
): WriteResult => {
  const operation = getMainOperation(request.query);
  const result: WriteResult = { dependencies: new Set() };

  const ctx: Context = {
    variables: normalizeVariables(operation, request.variables),
    fragments: getFragments(request.query),
    result,
    store,
  };

  const select = getSelectionSet(operation);
  if (operation.operation === 'query') {
    writeEntity(ctx, 'Query', select, data);
  } else {
    writeRoot(ctx, select, data);
  }

  return result;
};

const writeEntity = (
  ctx: Context,
  key: string,
  select: SelectionSet,
  data: Data
) => {
  writeSelection(ctx, ctx.store.findOrCreate(key), key, select, data);
};

const writeSelection = (
  ctx: Context,
  entity: Entity,
  key: string,
  select: SelectionSet,
  data: Data
) => {
  if (key !== 'Query') {
    ctx.result.dependencies.add(key);
  }

  entity.__typename = data.__typename as string;
  const { store, fragments, variables } = ctx;
  forEachFieldNode(select, fragments, variables, node => {
    const fieldName = getName(node);
    const fieldArgs = getFieldArguments(node, variables);
    const fieldKey = keyOfField(fieldName, fieldArgs);
    const fieldValue = data[getFieldAlias(node)];
    const childFieldKey = joinKeys(key, fieldKey);

    if (key === 'Query' && fieldName !== '__typename') {
      ctx.result.dependencies.add(childFieldKey);
    }

    if (node.selectionSet === undefined) {
      // This is a leaf node, so we're setting the field's value directly
      entity[fieldKey] = fieldValue;
    } else if (!isScalar(fieldValue)) {
      // Process the field and write links for the child entities that have been written
      const { selections: fieldSelect } = node.selectionSet;
      const link = writeField(ctx, childFieldKey, fieldSelect, fieldValue);
      store.setLink(childFieldKey, link);
      // We still have to mark the field for the GC operation
      entity[fieldKey] = undefined;
    } else {
      // This is a rare case for invalid entities
      entity[fieldKey] = fieldValue;
    }
  });
};

const writeField = (
  ctx: Context,
  parentFieldKey: string,
  select: SelectionSet,
  data: null | Data | NullArray<Data>
): Link => {
  if (Array.isArray(data)) {
    return data.map((item, index) => {
      // Append the current index to the parentFieldKey fallback
      const indexKey = joinKeys(parentFieldKey, `${index}`);
      // Recursively write array data
      const links = writeField(ctx, indexKey, select, item);
      // Link cannot be expressed as a recursive type
      return links as string | null;
    });
  } else if (data === null) {
    return null;
  }

  const entityKey = keyOfEntity(data);
  const key = entityKey !== null ? entityKey : parentFieldKey;
  writeEntity(ctx, key, select, data);
  return key;
};

// This is like writeSelection but assumes no parent entity exists
const writeRoot = (ctx: Context, select: SelectionSet, data: Data) => {
  const { fragments, variables } = ctx;
  forEachFieldNode(select, fragments, variables, node => {
    const fieldValue = data[getFieldAlias(node)];

    if (
      node.selectionSet !== undefined &&
      fieldValue !== null &&
      !isScalar(fieldValue)
    ) {
      const { selections: fieldSelect } = node.selectionSet;
      writeRootField(ctx, fieldValue, fieldSelect);
    }
  });
};

// This is like writeField but doesn't fall back to a generated key
const writeRootField = (
  ctx: Context,
  data: null | Data | NullArray<Data>,
  select: SelectionSet
) => {
  if (Array.isArray(data)) {
    return data.map(item => writeRootField(ctx, item, select));
  } else if (data === null) {
    return;
  }

  // Write entity to key that falls back to the given parentFieldKey
  const entityKey = keyOfEntity(data);
  if (entityKey !== null) {
    writeEntity(ctx, entityKey, select, data);
  }
};

// Without a typename field on Data or Data[] the result must be a scalar
// This effectively prevents us from writing Data into the store that
// doesn't have a __typename field
const isScalar = (x: any): x is Scalar | Scalar[] => {
  if (Array.isArray(x)) {
    return x.some(isScalar);
  }

  return (
    typeof x !== 'object' ||
    (x !== null && typeof (x as any).__typename !== 'string')
  );
};
