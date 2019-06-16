/** Find the name of the calling component. */
export const getHookParent = () => {
  /**
   * Line values could be:
   * - named export             " at exports.Home (Home.tsx?9b1b:17)"
   * - default export / inline  " at Home (Home.tsx?9b1b:17)"
   */
  const stackLine = (new Error().stack as string).split('\n')[3];
  const parsedLine = /.*at (exports\.)?(\w+)/.exec(stackLine);

  return parsedLine === null || typeof parsedLine[2] !== 'string'
    ? 'Unknown'
    : parsedLine[2];
};
