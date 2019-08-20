import {
  forEachFieldNode,
  getFragments,
  getMainOperation,
  getSelectionSet,
  normalizeVariables,
  getName,
  getFieldArguments,
  getFieldAlias,
} from '../ast';

import {
  Fragments,
  Variables,
  Data,
  DataField,
  Link,
  SelectionSet,
  Completeness,
  OperationRequest,
} from '../types';

import {
  Store,
  addDependency,
  getCurrentDependencies,
  initStoreState,
  clearStoreState,
} from '../store';

import { joinKeys, keyOfEntity, keyOfField } from '../helpers';

export interface QueryResult {
  completeness: Completeness;
  dependencies: Set<string>;
  data: null | Data;
}

interface Context {
  result: QueryResult;
  store: Store;
  variables: Variables;
  fragments: Fragments;
}

/** Reads a request entirely from the store */
export const query = (store: Store, request: OperationRequest): QueryResult => {
  initStoreState(0);

  const operation = getMainOperation(request.query);
  const root: Data = Object.create(null);
  const result: QueryResult = {
    completeness: 'FULL',
    dependencies: getCurrentDependencies(),
    data: root,
  };

  const ctx: Context = {
    variables: normalizeVariables(operation, request.variables),
    fragments: getFragments(request.query),
    result,
    store,
  };

  result.data = readSelection(ctx, 'Query', getSelectionSet(operation), root);
  clearStoreState();
  return result;
};

const readSelection = (
  ctx: Context,
  entityKey: string,
  select: SelectionSet,
  data: Data
): Data | null => {
  const isQuery = entityKey === 'Query';
  if (!isQuery) addDependency(entityKey);

  const { store, fragments, variables } = ctx;

  // Get the __typename field for a given entity to check that it exists
  const typename = store.getField(entityKey, '__typename');
  if (typeof typename !== 'string') {
    ctx.result.completeness = 'EMPTY';
    return null;
  }

  data.__typename = typename;

  forEachFieldNode(select, fragments, variables, node => {
    // Derive the needed data from our node.
    const fieldName = getName(node);
    const fieldArgs = getFieldArguments(node, variables);
    const fieldAlias = getFieldAlias(node);
    const fieldKey = joinKeys(entityKey, keyOfField(fieldName, fieldArgs));
    const fieldValue = store.getRecord(fieldKey);

    if (isQuery) addDependency(fieldKey);

    const resolvers = store.resolvers[typename];
    if (resolvers !== undefined && resolvers.hasOwnProperty(fieldName)) {
      // We have a resolver for this field.
      const resolverValue = resolvers[fieldName](
        data,
        fieldArgs || {},
        store,
        ctx
      );

      if (node.selectionSet === undefined) {
        // If it doesn't have a selection set we have resolved a property.
        // TODO: Completeness for scalar fields
        data[fieldAlias] = resolverValue !== undefined ? resolverValue : null;
      } else {
        // When it has a selection set we are resolving an entity with a
        // subselection. This can either be a list or an object.
        const fieldSelect = getSelectionSet(node);

        data[fieldAlias] = resolveResolverResult(
          ctx,
          resolverValue,
          fieldKey,
          fieldSelect,
          data[fieldAlias] as Data | Data[]
        );
      }
    } else if (node.selectionSet === undefined) {
      // The field is a scalar and can be retrieved directly
      if (fieldValue === undefined) {
        // Cache Incomplete: A missing field means it wasn't cached
        ctx.result.completeness = 'EMPTY';
        data[fieldAlias] = null;
      } else {
        // Not dealing with null means it's a regular property.
        data[fieldAlias] = fieldValue;
      }
    } else {
      // null values mean that a field might be linked to other entities
      const fieldSelect = getSelectionSet(node);
      const link = store.getLink(fieldKey);

      // Cache Incomplete: A missing link for a field means it's not cached
      if (link === undefined) {
        if (typeof fieldValue === 'object' && fieldValue !== null) {
          // The entity on the field was invalid and can still be recovered
          data[fieldAlias] = fieldValue;
        } else {
          ctx.result.completeness = 'EMPTY';
          data[fieldAlias] = null;
        }
      } else {
        const prevData = data[fieldAlias] as Data;
        data[fieldAlias] = resolveLink(ctx, link, fieldSelect, prevData);
      }
    }
  });

  return data;
};

const resolveResolverResult = (
  ctx: Context,
  result: DataField,
  key: string,
  select: SelectionSet,
  prevData: void | Data | Data[]
) => {
  // When we are dealing with a list we have to call this method again.
  if (Array.isArray(result)) {
    // @ts-ignore: Link cannot be expressed as a recursive type
    return result.map((childResult, index) => {
      const data = prevData !== undefined ? prevData[index] : undefined;
      const indexKey = joinKeys(key, `${index}`);
      return resolveResolverResult(ctx, childResult, indexKey, select, data);
    });
  } else if (result === null) {
    return null;
  } else if (isDataOrKey(result)) {
    // We don't need to read the entity after exiting a resolver
    // we can just go on and read the selection further.
    const data = prevData === undefined ? Object.create(null) : prevData;
    const childKey =
      (typeof result === 'string' ? result : keyOfEntity(result)) || key;
    const selectionResult = readSelection(ctx, childKey, select, data);

    if (selectionResult !== null && typeof result === 'object') {
      for (key in result) {
        if (key !== '__typename' && result.hasOwnProperty(key)) {
          selectionResult[key] = result[key];
        }
      }
    }

    return selectionResult;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      'Expected to receive a Link or an Entity from a Resolver but got a Scalar.'
    );
  }

  ctx.result.completeness = 'EMPTY';
  return null;
};

const resolveLink = (
  ctx: Context,
  link: Link | Link[],
  select: SelectionSet,
  prevData: void | Data | Data[]
): null | Data | Data[] => {
  if (Array.isArray(link)) {
    // @ts-ignore: Link cannot be expressed as a recursive type
    return link.map((childLink, index) => {
      const data = prevData !== undefined ? prevData[index] : undefined;
      return resolveLink(ctx, childLink, select, data);
    });
  } else if (link === null) {
    return null;
  } else {
    const data = prevData === undefined ? Object.create(null) : prevData;
    return readSelection(ctx, link, select, data);
  }
};

const isDataOrKey = (x: any): x is string | Data =>
  typeof x === 'string' ||
  (typeof x === 'object' &&
    x !== null &&
    typeof (x as any).__typename === 'string');
