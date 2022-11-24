import '@urql/core';

declare module '@urql/core' {
  interface DebugEventTypes {
    /** Typescript won't let us explicitly state this value as undefined w/ no property */
    teardown: undefined;
    /** An execute[query|mutation|subscription] call. */
    execution: {
      sourceComponent: string;
    };
    /** An operation result with data. */
    update: { value: any };
    /** An operation result with error. */
    error: { value: any };
  }
}
