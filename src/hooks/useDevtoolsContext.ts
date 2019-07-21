import { useMemo, useRef } from 'react';

/** Find the name of the calling component. */
const getHookParent = () => {
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

const useDevtoolsContextHook = () => {
  const source = useRef(getHookParent());

  return useMemo(() => [{ meta: { source: source.current } }], []);
};

/** Creates additional context values for serving metadata to devtools. */
export const useDevtoolsContext =
  process.env.NODE_ENV === 'production'
    ? () => [undefined]
    : useDevtoolsContextHook;
