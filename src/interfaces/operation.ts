import { IQuery } from './query';

/* This is an "enriched" Query which makes it ready to
 * go through an OperationQueue. It contains a context
 * that will be relevant to the Exchange.
 * - `key`: The unique identifier of the Query
 * - `operationName`: The GraphQL operation like "query" or "mutation"
 * - `context`: Any options that the Exchange should receive
 */
export interface IOperation extends IQuery {
  key: string;
  operationName: string;
  context: Record<string, any>;
}
