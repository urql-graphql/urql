/** A hash value as computed by {@link phash}.
 *
 * @remarks
 * Typically `HashValue`s are used as hashes and keys of GraphQL documents,
 * variables, and combined, for GraphQL requests.
 */
export type HashValue = number & {
  /** Marker to indicate that a `HashValue` may not be created by a user.
   *
   * @remarks
   * `HashValue`s are created by {@link phash} and are marked as such to not mix them
   * up with other numbers and prevent them from being created or used outside of this
   * hashing function.
   *
   * @internal
   */
  readonly _opaque: unique symbol;
};

/** Computes a djb2 hash of the given string.
 *
 * @param x - the string to be hashed
 * @param seed - optionally a prior hash for progressive hashing
 * @returns a hash value, i.e. a number
 *
 * @remark
 * This is the hashing function used throughout `urql`, primarily to compute
 * {@link Operation.key}.
 *
 * @see {@link http://www.cse.yorku.ca/~oz/hash.html#djb2} for a further description of djb2.
 */
export const phash = (x: string, seed?: HashValue): HashValue => {
  let h = (seed || 5381) | 0;
  for (let i = 0, l = x.length | 0; i < l; i++)
    h = (h << 5) + h + x.charCodeAt(i);
  return h as HashValue;
};
