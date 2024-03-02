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

export const invalidateType = (typename: string) => {
  const types = InMemoryData.getEntitiesForType(typename);
  for (const entity of types) {
    invalidateEntity(entity);
  }
};
