interface EntityLike {
  [key: string]: EntityLike | EntityLike[] | any;
  __typename: string | null | void;
}

const collectTypes = (obj: EntityLike | EntityLike[], types: Set<string>) => {
  if (Array.isArray(obj)) {
    for (let i = 0, l = obj.length; i < l; i++) {
      collectTypes(obj[i], types);
    }
  } else if (typeof obj === 'object' && obj !== null) {
    for (const key in obj) {
      if (key === '__typename' && typeof obj[key] === 'string') {
        types.add(obj[key] as string);
      } else {
        collectTypes(obj[key], types);
      }
    }
  }

  return types;
};

/** Finds and returns a list of `__typename` fields found in response data.
 *
 * @privateRemarks
 * This is used by `@urql/core`’s document `cacheExchange` to find typenames
 * in a given GraphQL response’s data.
 */
export const collectTypenames = (response: object): string[] => [
  ...collectTypes(response as EntityLike, new Set()),
];
