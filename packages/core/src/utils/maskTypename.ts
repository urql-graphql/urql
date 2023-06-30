/** Used to recursively mark `__typename` fields in data as non-enumerable.
 *
 * @deprecated Not recommended over modelling inputs manually (See #3299)
 *
 * @remarks
 * This utility can be used to recursively copy GraphQl response data and hide
 * all `__typename` fields present on it.
 *
 * Hint: It’s not recommended to do this, unless it's absolutely necessary as
 * cloning and modifying all data of a response can be unnecessarily slow, when
 * a manual and more specific copy/mask is more efficient.
 *
 * @see {@link ClientOptions.maskTypename} for a description of how the `Client` uses this utility.
 */
export const maskTypename = (data: any, isRoot?: boolean): any => {
  if (!data || typeof data !== 'object') {
    return data;
  } else if (Array.isArray(data)) {
    return data.map(d => maskTypename(d));
  } else if (
    data &&
    typeof data === 'object' &&
    (isRoot || '__typename' in data)
  ) {
    const acc = {};
    for (const key in data) {
      if (key === '__typename') {
        Object.defineProperty(acc, '__typename', {
          enumerable: false,
          value: data.__typename,
        });
      } else {
        acc[key] = maskTypename(data[key]);
      }
    }
    return acc;
  } else {
    return data;
  }
};
