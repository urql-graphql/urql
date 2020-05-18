// These are guards that are used throughout the codebase to warn or error on
// unexpected behaviour or conditions.
// Every warning and error comes with a number that uniquely identifies them.
// You can read more about the messages themselves in `docs/graphcache/errors.md`
export type ErrorCode =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 15
  | 16
  | 17
  | 18
  | 19;

// URL unfurls to https://formidable.com/open-source/urql/docs/graphcache/errors/
const helpUrl = '\nhttps://bit.ly/2XbVrpR#';
const cache = new Set<string>();

export function invariant(
  condition: any,
  message: string,
  code: ErrorCode
): asserts condition {
  if (!condition) {
    const errorMessage = message || 'Minfied Error #' + code + '\n';

    const error = new Error(errorMessage + helpUrl + code);
    error.name = 'Graphcache Error';
    throw error;
  }
}

export function warn(message: string, code: ErrorCode) {
  if (!cache.has(message)) {
    console.warn(message + helpUrl + code);
    cache.add(message);
  }
}
