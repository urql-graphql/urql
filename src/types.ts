import { Observable } from 'rxjs';

/** A Graphql query */
export interface Query {
  /** Graphql query string */
  query: string;
  /** Graphql query variables */
  variables?: object;
}

/** A Graphql mutation */
export type Mutation = Query;

/** A Graphql [query]{@link Query} or [mutation]{@link Mutation} accompanied with metadata */
export interface Operation extends Query {
  /** Unique identifier of the operation */
  key: string;
  /** The type of Grapqhql operation being executed */
  operationName: string;
  /** Additional metadata passed to [exchange]{@link Exchange} functions */
  options: Record<string, any>;
}

/** Function responsible for listening for streamed [operations]{@link Operation}. */
export type Exchange = (
  /** Function to call the next [exchange]{@link Exchange} in the chain */
  forward: ExchangeIO
) => ExchangeIO;

/** Function responsible for receiving an observable [operation]{@link Operation} and returning a [result]{@link ExchangeResult} */
export type ExchangeIO = (
  ops$: Observable<Operation>
) => Observable<ExchangeResult>;

/** Resulting data from an [operation]{@link Operation} */
export interface ExchangeResult {
  /** The operation which has been executed */
  operation: Operation;
  /** The data returned from the Graphql server */
  data: any;
  /** Any errors resulting from the operation */
  error?: Error;
}
