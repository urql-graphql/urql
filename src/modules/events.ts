import { IExchangeResult } from '../interfaces';

export enum ClientEventType {
  InvalidateTypenames = 'InvalidateTypenames',
  RefreshAll = 'RefreshAll',
}

export interface IClientEventRaw<E, P> {
  payload: P;
  type: E;
}

export type IClientEvent = IClientEventRaw<
  ClientEventType.InvalidateTypenames,
  { typenames: string[]; changes: IExchangeResult }
> &
  IClientEventRaw<ClientEventType.RefreshAll, void>;
