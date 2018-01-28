import { IQuery } from './query';

export interface IMutation {
  [key: string]: IQuery;
}
