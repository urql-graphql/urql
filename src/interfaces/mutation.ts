import { Query } from './query';

export interface Mutation {
  [key: string]: Query;
}
