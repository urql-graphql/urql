import * as InMemoryData from '../store/data';
import { keyOfField } from '../store/keys';
import type { FieldArgs } from '../types';

interface PartialFieldInfo {
  fieldKey: string;
}

export const invalidateEntity = (
  entityKey: string,
  field?: string,
  args?: FieldArgs
) => {
  const fields: PartialFieldInfo[] = field
    ? [{ fieldKey: keyOfField(field, args) }]
    : InMemoryData.inspectFields(entityKey);

  for (let i = 0, l = fields.length; i < l; i++) {
    const { fieldKey } = fields[i];
    if (InMemoryData.readLink(entityKey, fieldKey) !== undefined) {
      InMemoryData.writeLink(entityKey, fieldKey, undefined);
    } else {
      InMemoryData.writeRecord(entityKey, fieldKey, undefined);
    }
  }
};

export const invalidateType = (
  typename: string,
  excludedEntities: string[]
) => {
  const types = InMemoryData.getEntitiesForType(typename);
  const iterator = types[Symbol.iterator]();
  for (let result = iterator.next(); !result.done; result = iterator.next()) {
    if (excludedEntities.includes(result.value)) continue;
    invalidateEntity(result.value);
  }
};
