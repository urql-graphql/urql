export enum ClientEventType {
  RefreshAll = 'RefreshAll',
  CacheKeysInvalidated = 'CacheKeysInvalidated',
}

// NOTE: The only way to define precise strong types for events are to create
// an interface for a function that accepts overloaded arguments
// Each `type` argument corresponds to its call with its payload.
// All argument lengths must match up so empty payloads must have type `void`
// This interface is used for both `dispatch` functions and `listener` callbacks
export interface IEventFn {
  (type: ClientEventType.RefreshAll, payload: void): void;
  (type: ClientEventType.CacheKeysInvalidated, payload: string[]): void;
}
