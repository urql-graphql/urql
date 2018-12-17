import { IExchangeResult } from './';

export type FetchOptions = { skipCache?: boolean };

export interface IQueryHookOpts {
  variables?: object;
}

export interface IQueryHook<Data> {
  data: Data;
  loaded: boolean;
  error: Error | null;
  fetching: boolean;
  refetch(options: FetchOptions): void;
}

export interface ISubscriptionHook<Data> {
  data: Data;
  loaded: boolean;
  error: Error | null;
  fetching: boolean;
}

export type IMutationHook<Args, Result> = (
  data: Args
) => Promise<IExchangeResult<Result>['data']>;
