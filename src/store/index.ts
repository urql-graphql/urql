import { DocumentNode } from 'graphql';
import { Map, make, get, set, remove } from 'pessimism';

import {
  EntityField,
  Link,
  ResolverConfig,
  ResolverResult,
  SystemFields,
  Variables,
  Data,
  UpdatesConfig,
} from '../types';

import { keyOfEntity, joinKeys, keyOfField } from '../helpers';
import { query, write, writeFragment } from '../operations';

export class Store {
  records: Map<EntityField>;
  links: Map<Link>;

  resolvers: ResolverConfig;
  updates: UpdatesConfig;

  constructor(resolvers?: ResolverConfig, updates?: UpdatesConfig) {
    this.records = make();
    this.links = make();
    this.resolvers = resolvers || {};
    this.updates = updates || {};
  }

  getRecord(fieldKey: string): EntityField {
    return get(this.records, fieldKey);
  }

  removeRecord(fieldKey: string) {
    return (this.records = remove(this.records, fieldKey));
  }

  writeRecord(field: EntityField, fieldKey: string) {
    return (this.records = set(this.records, fieldKey, field));
  }

  getField(
    entityKey: string,
    fieldName: string,
    args?: Variables
  ): EntityField {
    const fieldKey = joinKeys(entityKey, keyOfField(fieldName, args));
    return this.getRecord(fieldKey);
  }

  writeField(
    field: EntityField,
    entityKey: string,
    fieldName: string,
    args?: Variables
  ) {
    const fieldKey = joinKeys(entityKey, keyOfField(fieldName, args));
    return (this.records = set(this.records, fieldKey, field));
  }

  getLink(key: string): undefined | Link {
    return get(this.links, key);
  }

  removeLink(key: string) {
    return (this.links = remove(this.links, key));
  }

  writeLink(link: Link, key: string) {
    return (this.links = set(this.links, key, link));
  }

  resolveValueOrLink(fieldKey: string): ResolverResult {
    const fieldValue = this.getRecord(fieldKey);
    // Undefined implies a link OR incomplete data.
    // A value will imply that we are just fetching a field like date.
    if (fieldValue !== undefined) return fieldValue;

    // This can be an array OR a string OR undefined again
    const link = this.getLink(fieldKey);
    return link ? link : null;
  }

  resolve(
    entity: SystemFields,
    field: string,
    args?: Variables
  ): ResolverResult {
    if (typeof entity === 'string') {
      return this.resolveValueOrLink(joinKeys(entity, keyOfField(field, args)));
    } else {
      // This gives us __typename:key
      const entityKey = keyOfEntity(entity);
      if (entityKey === null) return null;
      return this.resolveValueOrLink(
        joinKeys(entityKey, keyOfField(field, args))
      );
    }
  }

  updateQuery(
    dataQuery: DocumentNode,
    updater: (data: Data | null) => Data
  ): void {
    const { data } = query(this, { query: dataQuery });
    write(this, { query: dataQuery }, updater(data));
  }

  writeFragment(dataFragment: DocumentNode, data: Data): void {
    writeFragment(this, dataFragment, data);
  }
}
