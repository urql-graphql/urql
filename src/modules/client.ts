import { hashString } from './hash';
import { ClientOptions, Query, Mutation } from '../interfaces/index';
import { gankTypeNamesFromResponse } from '../modules/typenames';
import uuid from 'uuid';

// Response from executeQuery call
export type QueryResponse = {
  data: Array<object>;
  typeNames?: Array<string>;
};

export default class Client {
  private url?: string; // Graphql API URL
  private store: object; // Internal store
  private fetchOptions: object; // Options for fetch call
  private subscriptions: object; // Map of subscribed Connect components

  constructor(opts: ClientOptions) {
    // Set option/internal defaults
    this.url = opts.url || null;
    this.fetchOptions = opts.fetchOptions || {};
    this.store = {};
    this.subscriptions = {};
    // Bind methods
    this.executeQuery = this.executeQuery.bind(this);
    this.executeMutation = this.executeMutation.bind(this);
    this.updateSubscribers = this.updateSubscribers.bind(this);
  }

  private updateSubscribers(typenames, changes) {
    // On mutation, call subscribed callbacks with eligible typenames
    for (let sub in this.subscriptions) {
      this.subscriptions[sub](typenames,changes);
    }
  }

  public subscribe(callback: (changedTypes: Array<string>, response: object) => void): string {
    // Create an identifier, add callback to subscriptions, return identifier
    const id = uuid.v4();
    this.subscriptions[id] = callback;
    return id;
  }

  public unsubscribe(id: string) {
    // Delete from subscriptions by identifier
    delete this.subscriptions[id];
  }

  public executeQuery(
    queryObject: Query,
    skipCache: Boolean
  ): Promise<QueryResponse> {
    return new Promise<QueryResponse>(async (resolve, reject) => {
      const { query, variables } = queryObject;
      // Create query POST body
      const body = JSON.stringify({
        query,
        variables,
      });

      // Create hash from serialized body
      const hash = hashString(body);

      // Check cache for hash
      if (this.store[hash] && !skipCache) {
        resolve({ data: this.store[hash] });
      } else {
        try {
          // Fetch data
          const result = await fetch(this.url, {
            method: 'POST',
            body: body,
            headers: { 'Content-Type': 'application/json' },
            ...this.fetchOptions,
          });

          const response = await result.json();
          if (response.data) {
            // Grab typenames from response data
            const typeNames = response.data |> gankTypeNamesFromResponse;
            // Store data in cache, using serialized query as key
            this.store[hash] = response.data;
            resolve({
              data: response.data,
              typeNames,
            });
          } else {
            reject({
              message: 'No data',
            });
          }
        } catch (e) {
          reject(e);
        }
      }
    });
  }

  public executeMutation(mutationObject: Mutation): Promise<Array<object>> {
    return new Promise<Array<object>>(async (resolve, reject) => {
      const { query, variables } = mutationObject;
      // Convert POST body to string
      const body = JSON.stringify({
        query,
        variables,
      });
      try {
        // Call mutation
        const result = await fetch(this.url, {
          method: 'POST',
          body: body,
          headers: { 'Content-Type': 'application/json' },
          ...this.fetchOptions,
        });

        const response = await result.json();
        if (response.data) {
          // Retrieve typenames from response data
          // Notify subscribed Connect wrappers
          response.data
            |> gankTypeNamesFromResponse
            |> (_ => this.updateSubscribers(_, response));

          resolve(response.data);
        } else {
          reject({
            message: 'No data',
          });
        }
      } catch (e) {
        reject(e);
      }
    });
  }
}
