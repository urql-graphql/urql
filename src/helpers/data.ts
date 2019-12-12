import { Link, EntityField, FieldInfo } from '../types';
import { fieldInfoOfKey } from './keys';

type Dict<T> = Record<string, T>;
type KeyMap<T> = Map<string, T>;
type OptimisticMap<T> = Record<number, T>;

interface NodeMap<T> {
  optimistic: OptimisticMap<KeyMap<Dict<T | undefined>>>;
  base: KeyMap<Dict<T>>;
  keys: number[];
}

export interface InMemoryData {
  gcBatch: Set<string>;
  refCount: Dict<number>;
  refLock: OptimisticMap<Dict<number>>;
  records: NodeMap<EntityField>;
  links: NodeMap<Link>;
}

let currentOptimisticKey: null | number = null;

const makeDict = <T>(): Dict<T> => Object.create(null);

const makeNodeMap = <T>(): NodeMap<T> => ({
  optimistic: makeDict(),
  base: new Map(),
  keys: [],
});

export const setCurrentOptimisticKey = (optimisticKey: number | null) => {
  currentOptimisticKey = optimisticKey;
};

export const make = (): InMemoryData => ({
  gcBatch: new Set(),
  refCount: makeDict(),
  refLock: makeDict(),
  links: makeNodeMap(),
  records: makeNodeMap(),
});

/** Adds a node value to a NodeMap (taking optimistic values into account */
const setNode = <T>(
  map: NodeMap<T>,
  entityKey: string,
  fieldKey: string,
  value: T
) => {
  // Optimistic values are written to a map in the optimistic dict
  // All other values are written to the base map
  let keymap: KeyMap<Dict<T | undefined>>;
  if (currentOptimisticKey) {
    // If the optimistic map doesn't exist yet, it' created, and
    // the optimistic key is stored (in order of priority)
    if (map.optimistic[currentOptimisticKey] === undefined) {
      map.optimistic[currentOptimisticKey] = new Map();
      map.keys.unshift(currentOptimisticKey);
    }

    keymap = map.optimistic[currentOptimisticKey];
  } else {
    keymap = map.base;
  }

  // On the map itself we get or create the entity as a dict
  let entity = keymap.get(entityKey) as Dict<T | undefined>;
  if (entity === undefined) {
    keymap.set(entityKey, (entity = makeDict()));
  }

  // If we're setting undefined we delete the node's entry
  // On optimistic layers we actually set undefined so it can
  // override the base value
  if (value === undefined && !currentOptimisticKey) {
    delete entity[fieldKey];
  } else {
    entity[fieldKey] = value;
  }
};

/** Gets a node value from a NodeMap (taking optimistic values into account */
const getNode = <T>(
  map: NodeMap<T>,
  entityKey: string,
  fieldKey: string
): T | undefined => {
  // This first iterates over optimistic layers (in order)
  for (let i = 0, l = map.keys.length; i < l; i++) {
    const optimistic = map.optimistic[map.keys[i]];
    const node = optimistic.get(entityKey);
    // If the node and node value exists it is returned, including undefined
    if (node !== undefined && fieldKey in node) {
      return node[fieldKey];
    }
  }

  // Otherwise we read the non-optimistic base value
  const node = map.base.get(entityKey);
  return node !== undefined ? node[fieldKey] : undefined;
};

/** Clears an optimistic layers from a NodeMap */
const clearOptimisticNodes = <T>(map: NodeMap<T>, optimisticKey: number) => {
  // Check whether the optimistic layer exists on the NodeMap
  const index = map.keys.indexOf(optimisticKey);
  if (index > -1) {
    // Then delete it and splice out the optimisticKey
    delete map.optimistic[optimisticKey];
    map.keys.splice(index, 1);
  }
};

/** Adjusts the reference count of an entity on a refCount dict by "by" and updates the gcBatch */
const updateRCForEntity = (
  gcBatch: void | Set<string>,
  refCount: Dict<number>,
  entityKey: string,
  by: number
) => {
  // Retrieve the reference count
  const count = refCount[entityKey] !== undefined ? refCount[entityKey] : 0;
  // Adjust it by the "by" value
  const newCount = (refCount[entityKey] = (count + by) | 0);
  // Add it to the garbage collection batch if it needs to be deleted or remove it
  // from the batch if it needs to be kept
  if (gcBatch !== undefined) {
    if (newCount <= 0) gcBatch.add(entityKey);
    else if (count <= 0 && newCount > 0) gcBatch.delete(entityKey);
  }
};

/** Adjusts the reference counts of all entities of a link on a refCount dict by "by" and updates the gcBatch */
const updateRCForLink = (
  gcBatch: void | Set<string>,
  refCount: Dict<number>,
  link: Link | undefined,
  by: number
) => {
  if (typeof link === 'string') {
    updateRCForEntity(gcBatch, refCount, link, by);
  } else if (Array.isArray(link)) {
    for (let i = 0, l = link.length; i < l; i++) {
      const entityKey = link[i];
      if (entityKey) {
        updateRCForEntity(gcBatch, refCount, entityKey, by);
      }
    }
  }
};

/** Writes all parsed FieldInfo objects of a given node dict to a given array if it hasn't been seen */
const extractNodeFields = <T>(
  fieldInfos: FieldInfo[],
  seenFieldKeys: Set<string>,
  node: Dict<T> | undefined
) => {
  if (node !== undefined) {
    for (const fieldKey in node) {
      if (!seenFieldKeys.has(fieldKey)) {
        // If the node hasn't been seen the serialized fieldKey is turnt back into
        // a rich FieldInfo object that also contains the field's name and arguments
        fieldInfos.push(fieldInfoOfKey(fieldKey));
        seenFieldKeys.add(fieldKey);
      }
    }
  }
};

/** Writes all parsed FieldInfo objects of all nodes in a NodeMap to a given array */
const extractNodeMapFields = <T>(
  fieldInfos: FieldInfo[],
  seenFieldKeys: Set<string>,
  entityKey: string,
  map: NodeMap<T>
) => {
  // Extracts FieldInfo for the entity in the base map
  extractNodeFields(fieldInfos, seenFieldKeys, map.base.get(entityKey));

  // Then extracts FieldInfo for the entity from the optimistic maps
  for (let i = 0, l = map.keys.length; i < l; i++) {
    const optimistic = map.optimistic[map.keys[i]];
    extractNodeFields(fieldInfos, seenFieldKeys, optimistic.get(entityKey));
  }
};

/** Garbage collects all entities that have been marked as having no references */
export const gc = (data: InMemoryData) => {
  // Iterate over all entities that have been marked for deletion
  // Entities have been marked for deletion in `updateRCForEntity` if
  // their reference count dropped to 0
  data.gcBatch.forEach(entityKey => {
    // Check first whether the reference count is still 0
    const rc = data.refCount[entityKey] || 0;
    if (rc <= 0) {
      // Each optimistic layer may also still contain some references to marked entities
      for (const optimisticKey in data.refLock) {
        const refCount = data.refLock[optimisticKey];
        const locks = refCount[entityKey] || 0;
        // If the optimistic layer has any references to the entity, don't GC it,
        // otherwise delete the reference count from the optimistic layer
        if (locks > 0) return;
        delete refCount[entityKey];
      }

      // All conditions are met: The entity can be deleted

      // Delete the reference count, all records, and delete the entity from the GC batch
      // No optimistic data needs to be deleted, as the entity is not being referenced by
      // anything and optimistic layers will eventually be deleted anyway
      delete data.refCount[entityKey];
      data.records.base.delete(entityKey);
      data.gcBatch.delete(entityKey);

      // Delete all the entity's links, but also update the reference count
      // for those links (which can lead to an unrolled recursive GC of the children)
      const linkNode = data.links.base.get(entityKey);
      if (linkNode !== undefined) {
        data.links.base.delete(entityKey);
        for (const key in linkNode) {
          updateRCForLink(data.gcBatch, data.refCount, linkNode[key], -1);
        }
      }
    } else {
      data.gcBatch.delete(entityKey);
    }
  });
};

/** Reads an entity's field (a "record") from data */
export const readRecord = (
  data: InMemoryData,
  entityKey: string,
  fieldKey: string
): EntityField => getNode(data.records, entityKey, fieldKey);

/** Reads an entity's link from data */
export const readLink = (
  data: InMemoryData,
  entityKey: string,
  fieldKey: string
): Link | undefined => getNode(data.links, entityKey, fieldKey);

/** Writes an entity's field (a "record") to data */
export const writeRecord = (
  data: InMemoryData,
  entityKey: string,
  fieldKey: string,
  value: EntityField
) => setNode(data.records, entityKey, fieldKey, value);

/** Writes an entity's link to data */
export const writeLink = (
  data: InMemoryData,
  entityKey: string,
  fieldKey: string,
  link: Link | undefined
) => {
  // Retrieve the reference counting dict or the optimistic reference locking dict
  let refCount: Dict<number>;
  // Retrive the link NodeMap from either an optimistic or the base layer
  let links: KeyMap<Dict<Link | undefined>> | undefined;
  // Set the GC batch if we're not optimistically updating
  let gcBatch: void | Set<string>;
  if (currentOptimisticKey) {
    // The refLock counters are also reference counters, but they prevent
    // garbage collection instead of being used to trigger it
    refCount =
      data.refLock[currentOptimisticKey] ||
      (data.refLock[currentOptimisticKey] = makeDict());
    links = data.links.optimistic[currentOptimisticKey];
  } else {
    refCount = data.refCount;
    links = data.links.base;
    gcBatch = data.gcBatch;
  }

  // Retrieve the previous link for this field
  const prevLinkNode = links !== undefined ? links.get(entityKey) : undefined;
  const prevLink = prevLinkNode !== undefined ? prevLinkNode[fieldKey] : null;

  // Update the link
  setNode(data.links, entityKey, fieldKey, link);
  // First decrease the reference count for the previous link
  updateRCForLink(gcBatch, refCount, prevLink, -1);
  // Then increase the reference count for the new link
  updateRCForLink(gcBatch, refCount, link, 1);
};

/** Removes an optimistic layer of links and records */
export const clearOptimistic = (data: InMemoryData, optimisticKey: number) => {
  // We also delete the optimistic reference locks
  delete data.refLock[optimisticKey];
  clearOptimisticNodes(data.records, optimisticKey);
  clearOptimisticNodes(data.links, optimisticKey);
};

/** Return an array of FieldInfo (info on all the fields and their arguments) for a given entity */
export const inspectFields = (
  data: InMemoryData,
  entityKey: string
): FieldInfo[] => {
  const { links, records } = data;
  const fieldInfos: FieldInfo[] = [];
  const seenFieldKeys: Set<string> = new Set();
  // Extract FieldInfos to the fieldInfos array for links and records
  // This also deduplicates by keeping track of fieldKeys in the seenFieldKeys Set
  extractNodeMapFields(fieldInfos, seenFieldKeys, entityKey, links);
  extractNodeMapFields(fieldInfos, seenFieldKeys, entityKey, records);
  return fieldInfos;
};
