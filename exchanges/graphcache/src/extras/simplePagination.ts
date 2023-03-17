import { stringifyVariables } from '@urql/core';
import { Resolver, Variables, NullArray } from '../types';

export type MergeMode = 'before' | 'after';

/** Input parameters for the {@link simplePagination} factory. */
export interface PaginationParams {
  /** The name of the field argument used to define the page’s offset. */
  offsetArgument?: string;
  /** The name of the field argument used to define the page’s length. */
  limitArgument?: string;
  /** Flip between forward and backwards pagination.
   *
   * @remarks
   * When set to `'after'`, its default, pages are merged forwards and in order.
   * When set to `'before'`, pages are merged in reverse, putting later pages
   * in front of earlier ones.
   */
  mergeMode?: MergeMode;
}

/** Creates a {@link Resolver} that combines pages of a primitive pagination field.
 *
 * @param options - A {@link PaginationParams} configuration object.
 * @returns the created pagination {@link Resolver}.
 *
 * @remarks
 * `simplePagination` is a factory that creates a {@link Resolver} that can combine
 * multiple lists on a paginated field into a single, combined list for infinite
 * scrolling.
 *
 * Hint: It's not recommended to use this when you can handle infinite scrolling
 * in your UI code instead.
 *
 * @see {@link https://urql.dev/goto/docs/graphcache/local-resolvers#simple-pagination} for more information.
 * @see {@link https://urql.dev/goto/docs/basics/ui-patterns/#infinite-scrolling} for an alternate approach.
 */
export const simplePagination = ({
  offsetArgument = 'skip',
  limitArgument = 'limit',
  mergeMode = 'after',
}: PaginationParams = {}): Resolver<any, any, any> => {
  const compareArgs = (
    fieldArgs: Variables,
    connectionArgs: Variables
  ): boolean => {
    for (const key in connectionArgs) {
      if (key === offsetArgument || key === limitArgument) {
        continue;
      } else if (!(key in fieldArgs)) {
        return false;
      }

      const argA = fieldArgs[key];
      const argB = connectionArgs[key];

      if (
        typeof argA !== typeof argB || typeof argA !== 'object'
          ? argA !== argB
          : stringifyVariables(argA) !== stringifyVariables(argB)
      ) {
        return false;
      }
    }

    for (const key in fieldArgs) {
      if (key === offsetArgument || key === limitArgument) {
        continue;
      }
      if (!(key in connectionArgs)) return false;
    }

    return true;
  };

  return (_parent, fieldArgs, cache, info) => {
    const { parentKey: entityKey, fieldName } = info;

    const allFields = cache.inspectFields(entityKey);
    const fieldInfos = allFields.filter(info => info.fieldName === fieldName);
    const size = fieldInfos.length;
    if (size === 0) {
      return undefined;
    }

    const visited = new Set();
    let result: NullArray<string> = [];
    let prevOffset: number | null = null;

    for (let i = 0; i < size; i++) {
      const { fieldKey, arguments: args } = fieldInfos[i];
      if (args === null || !compareArgs(fieldArgs, args)) {
        continue;
      }

      const links = cache.resolve(entityKey, fieldKey) as string[];
      const currentOffset = args[offsetArgument];

      if (
        links === null ||
        links.length === 0 ||
        typeof currentOffset !== 'number'
      ) {
        continue;
      }

      const tempResult: NullArray<string> = [];

      for (let j = 0; j < links.length; j++) {
        const link = links[j];
        if (visited.has(link)) continue;
        tempResult.push(link);
        visited.add(link);
      }

      if (
        (!prevOffset || currentOffset > prevOffset) ===
        (mergeMode === 'after')
      ) {
        result = [...result, ...tempResult];
      } else {
        result = [...tempResult, ...result];
      }

      prevOffset = currentOffset;
    }

    const hasCurrentPage = cache.resolve(entityKey, fieldName, fieldArgs);
    if (hasCurrentPage) {
      return result;
    } else if (!(info as any).store.schema) {
      return undefined;
    } else {
      info.partial = true;
      return result;
    }
  };
};
