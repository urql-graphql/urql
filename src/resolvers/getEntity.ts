import { CacheResolver, Entity } from '../types';

export type ArgsToEntity = (args: null | object) => Entity;

export const getEntity = (makeEntity: ArgsToEntity): CacheResolver => {
  return (args, context) => {
    if (context.operation !== 'query') {
      return undefined;
    }

    const fauxEntity = makeEntity(args);
    const key = context.store.keyOfEntity(fauxEntity);
    const entity = key !== null ? context.store.getEntity(key) : undefined;

    if (entity === undefined) {
      context.isComplete = false;
      return null;
    }

    return entity;
  };
};
