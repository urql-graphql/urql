import { Component, ReactNode } from 'react';
import { CombinedError } from '../modules/error';
import { hashString } from '../modules/hash';
import { formatTypeNames } from '../modules/typenames';
import { zipObservables } from '../utils/zip-observables';

import {
  ClientEvent,
  ClientEventType,
  IClient,
  IExchangeResult,
  IMutation,
  IQuery,
} from '../interfaces/index';

export interface IClientProps {
  client: IClient; // Client instance
  children: (obj: object) => ReactNode; // Render prop
  subscription?: IQuery; // Subscription Query object
  query?: IQuery | IQuery[]; // Query object or array of Query objects
  mutation?: IMutation; // Mutation object (map)
  updateSubscription?: (
    prev: object | null,
    next: object | null
  ) => object | null; // Update query with subscription data
  cache?: boolean;
  typeInvalidation?: boolean;
  shouldInvalidate?: (
    changedTypes: string[],
    typeNames: string[],
    response: object,
    data: object
  ) => boolean;
}

export interface IClientFetchOpts {
  skipCache: boolean; // Should skip cache?
}

export interface IClientState {
  fetching: boolean; // Loading
  loaded: boolean; // Initial load
  error?: Error | CombinedError | CombinedError[]; // Error
  data: object | object[] | IClientState[]; // Data
}

export default class UrqlClient extends Component<IClientProps, IClientState> {
  static defaultProps = {
    cache: true,
    typeInvalidation: true,
  };

  state = {
    data: null,
    error: null,
    fetching: false,
    loaded: false,
  };

  willUpdateSubscription = false; // Flag that indicates the subscription's behaviour
  subscription = null; // Stored Subscription Query
  query = null; // Stored Query
  mutations = {}; // Stored Mutation
  typeNames = []; // Typenames that exist on current query
  unsubscribe = null; // Unsubscription function calling back to the client
  subscriptionSub = null; // Subscription for ongoing subscription queries
  querySub = null; // Subscription for ongoing queries

  componentDidMount() {
    this.formatProps(this.props);
  }

  componentDidUpdate(prevProps) {
    const nextProps = this.props;

    if (
      prevProps.query !== nextProps.query ||
      prevProps.mutation !== nextProps.mutation
    ) {
      this.formatProps(nextProps);
    }
  }

  componentWillUnmount() {
    // Unsub from change listener
    if (this.unsubscribe !== null) {
      this.unsubscribe();
    }

    if (this.subscriptionSub !== null) {
      this.subscriptionSub.unsubscribe();
    }

    if (this.querySub !== null) {
      this.querySub.unsubscribe();
    }
  }

  invalidate = queryObject => {
    const { cache } = this.props.client;
    if (queryObject) {
      const stringified = JSON.stringify(formatTypeNames(queryObject));
      const hash = hashString(stringified);
      return cache.invalidate(hash);
    } else {
      return Array.isArray(this.props.query)
        ? Promise.all(
            this.props.query.map(q =>
              cache.invalidate(hashString(JSON.stringify(q)))
            )
          )
        : cache.invalidate(hashString(JSON.stringify(this.query)));
    }
  };

  invalidateAll = () => {
    return this.props.client.cache.invalidateAll();
  };

  read = query => {
    const formatted = formatTypeNames(query);
    const stringified = JSON.stringify(formatted);
    const hash = hashString(stringified);
    return this.props.client.cache.read(hash);
  };

  updateCache = callback => {
    return this.props.client.cache.update(callback);
  };

  formatProps = props => {
    if (props.subscription && props.query && !props.updateSubscription) {
      throw new Error(
        'Passing a query and a subscription prop at the same time without an updateSubscription function is invalid.'
      );
    }

    this.willUpdateSubscription =
      props.subscription && props.query && props.updateSubscription;

    // If query exists
    if (props.query) {
      // Loop through and add typenames
      this.query = Array.isArray(props.query)
        ? props.query.map(formatTypeNames)
        : formatTypeNames(props.query);
      // Subscribe to change listener
      this.unsubscribe = props.client.subscribe(this.update);
      // Fetch initial data
      this.fetch(undefined, true);
    }

    // If subscription exists
    if (props.subscription) {
      // Loop through and add typenames
      this.subscription = formatTypeNames(props.subscription);
      // Fetch initial data
      this.subscribeToQuery();
    }

    // If mutation exists and has keys
    if (props.mutation) {
      this.mutations = {};
      // Loop through and add typenames
      Object.keys(props.mutation).forEach(key => {
        this.mutations[key] = formatTypeNames(props.mutation[key]);
      });
      // bind to mutate
      Object.keys(this.mutations).forEach(m => {
        const query = this.mutations[m].query;
        this.mutations[m] = variables => {
          return this.mutate({
            query,
            variables: {
              ...this.mutations[m].variables,
              ...variables,
            },
          });
        };
        if (!this.props.query) {
          this.forceUpdate();
        }
      });
    }
  };

  update = (event: ClientEvent) => {
    const { type } = event;

    if (type === ClientEventType.RefreshAll) {
      // RefreshAll indicates that the component should refetch its queries
      this.fetch();
      return;
    } else if (type === ClientEventType.InvalidateTypenames) {
      // InvalidateTypenames instructs us to reevaluate this component's typenames
      const { typenames, changes } = event.payload;

      let invalidated = false;
      if (this.props.shouldInvalidate) {
        invalidated = this.props.shouldInvalidate(
          typenames,
          this.typeNames,
          changes,
          this.state.data
        );
      } else if (this.props.typeInvalidation !== false) {
        // Check connection typenames, derived from query, for presence of mutated typenames
        invalidated = this.typeNames.some(
          typeName => typenames.indexOf(typeName) !== -1
        );
      }

      // If it has any of the type names that changed
      if (invalidated) {
        // Refetch the data from the server
        this.fetch({ skipCache: true });
      }
    }
  };

  refreshAllFromCache = () => {
    return this.props.client.refreshAllFromCache();
  };

  fetch = (
    opts: IClientFetchOpts = { skipCache: false },
    initial?: boolean
  ) => {
    const { client } = this.props;
    let { skipCache } = opts;

    if (this.props.cache === false) {
      skipCache = true;
    }

    if (this.querySub !== null) {
      this.querySub.unsubscribe();
      this.querySub = null;
    }

    // Start loading state
    this.setState({
      error: null,
      fetching: true,
    });

    // If query is not an array
    if (!Array.isArray(this.query)) {
      // Fetch the query
      this.querySub = client.executeQuery$(this.query, skipCache).subscribe({
        complete: () => {
          this.querySub = null;
        },
        error: e => {
          this.querySub = null;
          this.setState({
            error: e,
            fetching: false,
          });
        },
        next: result => {
          // Store the typenames
          this.typeNames = result.typeNames;

          // Update data
          this.setState({
            data: result.data || null,
            error: result.error,
            fetching: false,
            loaded: initial ? true : this.state.loaded,
          });
        },
      });
    } else {
      const partialData = [];
      const queries$ = this.query.map(query =>
        client.executeQuery$(query, skipCache).map(result => {
          // Accumulate and deduplicate all typeNames
          result.typeNames.forEach(typeName => {
            if (this.typeNames.indexOf(typeName) === -1) {
              this.typeNames.push(typeName);
            }
          });

          // Push to partial data and return same result
          partialData.push(result);
          return result;
        })
      );

      this.querySub = zipObservables(queries$).subscribe({
        error: e => {
          this.setState({
            data: partialData.map(part => part.data),
            error: e,
            fetching: false,
          });
        },
        next: (results: IExchangeResult[]) => {
          const errors = results.map(res => res.error).filter(Boolean);

          this.setState({
            data: results.map(res => res.data),
            error: errors.length > 0 ? errors : null,
            fetching: false,
            loaded: true,
          });
        },
      });
    }
  };

  subscribeToQuery = () => {
    const { client, updateSubscription } = this.props;

    if (this.subscriptionSub !== null) {
      this.subscriptionSub.unsubscribe();
      this.subscriptionSub = null;
    }

    if (!this.willUpdateSubscription) {
      // Start loading state
      this.setState({
        error: null,
        fetching: true,
      });
    }

    // Fetch the query
    this.subscriptionSub = client
      .executeSubscription$(this.subscription)
      .subscribe({
        complete: () => {
          this.subscriptionSub = null;
        },
        error: e => {
          this.subscriptionSub = null;
          this.setState({
            error: e,
            fetching: false,
          });
        },
        next: result => {
          const nextData = result.data || null;

          // Update data
          this.setState(
            state => ({
              data: this.willUpdateSubscription
                ? updateSubscription(state.data || null, nextData)
                : nextData,
              error: result.error,
              fetching: false,
              loaded: true,
            }),
            () => {
              const invalidate =
                this.willUpdateSubscription &&
                this.query &&
                this.props.typeInvalidation !== false;
              if (invalidate && Array.isArray(this.query)) {
                this.query.forEach(query => {
                  client.invalidateQuery(query);
                });
              } else if (invalidate) {
                client.invalidateQuery(this.query);
              }
            }
          );
        },
      });
  };

  mutate = mutation => {
    const { client } = this.props;

    // Set fetching state
    this.setState({
      error: null,
      fetching: true,
    });

    return new Promise<IExchangeResult['data']>((resolve, reject) => {
      // Execute mutation
      client.executeMutation$(mutation).subscribe({
        error: e => {
          this.setState(
            {
              error: e,
              fetching: false,
            },
            () => {
              reject(e);
            }
          );
        },
        next: result => {
          this.setState({ fetching: false }, () => {
            resolve(result);
          });
        },
      });
    });
  };

  render() {
    const cache = {
      invalidate: this.invalidate,
      invalidateAll: this.invalidateAll,
      read: this.read,
      update: this.updateCache,
    };

    return typeof this.props.children === 'function'
      ? this.props.children({
          ...this.state,
          ...this.mutations,
          cache,
          client: this.props.client,
          refetch: this.fetch,
          refreshAllFromCache: this.refreshAllFromCache,
        })
      : null;
  }
}
