import * as InMemoryData from '../store/data';
import { FieldArgs } from '../types';
import { keyOfField } from '../store';

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
