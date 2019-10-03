// These are guards that are used throughout the codebase to warn or error on
// unexpected behaviour or conditions.
// Every warning and error comes with a number that uniquely identifies them.
// You can read more about the messages themselves in `docs/help.md`

const helpUrl =
  '\nhttps://github.com/FormidableLabs/urql-exchange-graphcache/blob/master/docs/help.md#';
const cache = new Set<string>();

export const invariant = (clause: any, message: string, code: number) => {
  if (!clause) {
    const error = new Error(
      (message || 'Minfied Error #' + code + '\n') + helpUrl + code
    );
    error.name = 'Graphcache Error';
    throw error;
  }
};

export const warning = (clause: any, message: string, code: number) => {
  if (!clause && !cache.has(message)) {
    console.warn(message + helpUrl + code);
    cache.add(message);
  }
};
