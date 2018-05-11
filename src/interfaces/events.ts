import { IExchangeResult } from './exchange';

export enum ClientEventType {
  InvalidateTypenames = 'InvalidateTypenames',
  RefreshAll = 'RefreshAll',
}

export interface IClientEvent<E, P> {
  payload: P;
  type: E;
}

export type ClientEvent = IClientEvent<
  ClientEventType.InvalidateTypenames,
  { typenames: string[]; changes: IExchangeResult }
> &
  IClientEvent<ClientEventType.RefreshAll, void>;
