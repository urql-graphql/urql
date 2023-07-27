import type { Resolver, DirectivesConfig } from '../types';

const optional: Resolver = (_parent, _args, cache, info) => {
  const result = cache.resolve(info.parentKey, info.parentFieldKey);
  if (result === undefined) {
    info.partial = true;
    return null;
  } else {
    return result;
  }
};

const required: Resolver = (_parent, _args, cache, info) => {
  const result = cache.resolve(info.parentKey, info.parentFieldKey);
  return result == null ? undefined : result;
};

export const defaultDirectives: DirectivesConfig = {
  optional: () => optional,
  required: () => required,
};
