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
  Entity,
  Link,
  SelectionSet,
  Completeness,
  OperationRequest,
  NullArray,
} from '../types';

import { joinKeys, keyOfEntity, keyOfField } from '../helpers';
import { Store } from '../store';

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
  const operation = getMainOperation(request.query);
  const root: Data = Object.create(null);

  const result: QueryResult = {
    completeness: 'FULL',
    dependencies: new Set(),
    data: root,
  };

  const ctx: Context = {
    variables: normalizeVariables(operation, request.variables),
    fragments: getFragments(request.query),
    result,
    store,
  };

  result.data = readEntity(ctx, 'Query', getSelectionSet(operation), root);
  if (result.completeness === 'EMPTY') {
    result.data = null;
  }

  return result;
};

const readEntity = (
  ctx: Context,
  key: string,
  select: SelectionSet,
  data: Data
): Data | null => {
  // Get the entity from the store for given key.
  // This will start out as Query and evolve to <__typeName>:<id>
  let entity = ctx.store.find(key);

  if (entity === null) {
    // Cache Incomplete: A missing entity for a key means it wasn't cached
    ctx.result.completeness = 'EMPTY';
    return null;
  }
  // When we have an entity we want to resolve all properties selected.
  return readSelection(ctx, entity, key, select, data);
};

const readSelection = (
  ctx: Context,
  entity: Entity,
  key: string,
  select: SelectionSet,
  data: Data
): Data => {
  if (key !== 'Query') {
    // When we aren't dealing with a Query, example: Todo:1
    // We want to ensure the key is added to the dependencies,
    // in case a mutation alters this entity we need to refetch.
    ctx.result.dependencies.add(key);
  }

  data.__typename = entity.__typename;
  const { store, fragments, variables } = ctx;
  forEachFieldNode(select, fragments, variables, node => {
    // Derive the needed data from our node.
    const fieldName = getName(node);
    const fieldArgs = getFieldArguments(node, variables);
    const fieldAlias = getFieldAlias(node);
    const fieldKey = keyOfField(fieldName, fieldArgs);
    const fieldValue = entity[fieldKey];
    const childFieldKey = joinKeys(key, fieldKey);

    if (key === 'Query') {
      // When we are dealing with a Query we know the children
      // are actual entities so we should add these to our
      // dependencies.
      ctx.result.dependencies.add(childFieldKey);
    }

    const resolvers = store.resolvers[entity.__typename];
    if (resolvers !== undefined && resolvers.hasOwnProperty(fieldName)) {
      // We have a resolver for this field.
      const resolverValue = resolvers[fieldName](
        entity,
        fieldArgs || {},
        store,
        ctx
      );

      if (node.selectionSet === undefined) {
        // If it doesn't have a selection set we have resolved a property.
        data[fieldAlias] = resolverValue !== undefined ? resolverValue : null;
      } else {
        // When it has a selection set we are resolving an entity with a
        // subselection. This can either be a list or an object.
        const childEntity = resolverValue as Entity;
        const fieldSelect = getSelectionSet(node);
        const prevData = data[fieldAlias] as Data;

        data[fieldAlias] = readResolverSelection(
          ctx,
          childEntity,
          childFieldKey,
          fieldSelect,
          prevData
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
      const link = store.readLink(childFieldKey);

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
        data[fieldAlias] = readField(ctx, link, fieldSelect, prevData);
      }
    }
  });

  return data;
};

const readResolverSelection = (
  ctx: Context,
  entity: null | Entity | NullArray<Entity>,
  key: string,
  select: SelectionSet,
  prevData: void | Data | Data[]
) => {
  // When we are dealing with a list we have to call this method again.
  if (Array.isArray(entity)) {
    // @ts-ignore: Link cannot be expressed as a recursive type
    return entity.map((childEntity, index) => {
      const data = prevData !== undefined ? prevData[index] : undefined;
      const indexKey = joinKeys(key, `${index}`);
      return readResolverSelection(ctx, childEntity, indexKey, select, data);
    });
  } else if (entity === null) {
    return null;
  } else {
    const data = prevData === undefined ? Object.create(null) : prevData;
    const entityKey = keyOfEntity(entity);
    const childKey = entityKey !== null ? entityKey : key;
    // We don't need to read the entity after exiting a resolver
    // we can just go on and read the selection further.
    return readSelection(ctx, entity, childKey, select, data);
  }
};

const readField = (
  ctx: Context,
  link: Link | Link[],
  select: SelectionSet,
  prevData: void | Data | Data[]
): null | Data | Data[] => {
  if (Array.isArray(link)) {
    // @ts-ignore: Link cannot be expressed as a recursive type
    return link.map((childLink, index) => {
      const data = prevData !== undefined ? prevData[index] : undefined;
      return readField(ctx, childLink, select, data);
    });
  } else if (link === null) {
    return null;
  } else {
    const data = prevData === undefined ? Object.create(null) : prevData;
    return readEntity(ctx, link, select, data);
  }
};
