import { IExchangeResult } from './exchange';

export enum ClientEventType {
  InvalidateTypenames = 'InvalidateTypenames',
  RefreshAll = 'RefreshAll',
  CacheEntryUpdated = 'CacheEntryUpdated',
  CacheKeysDeleted = 'CacheKeysDeleted',
}

export interface IInvalidateTypenames {
  typenames: string[];
  changes: IExchangeResult;
}

// NOTE: The only way to define precise strong types for events are to create
// an interface for a function that accepts overloaded arguments
// Each `type` argument corresponds to its call with its payload.
// All argument lengths must match up so empty payloads must have type `void`
// This interface is used for both `dispatch` functions and `listener` callbacks
export interface IEventFn {
  (
    type: ClientEventType.InvalidateTypenames,
    payload: IInvalidateTypenames
  ): void;
  (type: ClientEventType.RefreshAll, payload: void): void;
  (type: ClientEventType.CacheKeysDeleted, payload: string[]): void;
  (type: ClientEventType.CacheEntryUpdated, payload: [string, any]): void;
}
