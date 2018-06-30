import { Component, ReactNode } from 'react';
import { CombinedError } from '../modules/error';
import { formatTypeNames } from '../modules/typenames';
import { zipObservables } from '../utils/zip-observables';

import {
  ClientEventType,
  IEventFn,
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
  cacheInvalidation?: boolean;
  cache?: boolean;
}

export interface IClientFetchOpts {
  skipCache?: boolean;
}

export interface IClientState {
  fetching: boolean; // Loading
  loaded: boolean; // Initial load
  error?: Error | CombinedError | CombinedError[]; // Error
  data: object | object[] | IClientState[]; // Data
}

export default class UrqlClient extends Component<IClientProps, IClientState> {
  static defaultProps = {
    cacheInvalidation: true,
    cache: true,
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
  queryKeys: { [key: string]: boolean } = {}; // Stored keys from querys' responses
  mutations = {}; // Stored Mutation
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
      this.fetch();
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

  update: IEventFn = (type: ClientEventType, payload) => {
    // This prop indicates that the Component should never update its data
    // from the cache or refetch anything
    if (!this.props.cacheInvalidation) {
      return;
    }

    // Since fetch goes through all exchanges (including a cacheExchange) fetching
    // can also just result in an update of the component's data without an actual
    // fetch call
    let shouldRefetch = false;

    if (type === ClientEventType.RefreshAll) {
      shouldRefetch = true;
    } else if (type === ClientEventType.CacheKeysInvalidated) {
      shouldRefetch = payload.some(key => this.queryKeys[key] === true);
    }

    if (shouldRefetch) {
      this.fetch();
    }
  };

  fetch = (opts: IClientFetchOpts = {}) => {
    const { client } = this.props;
    const skipCache = opts.skipCache || this.props.cache === false;

    // Cancel ongoing query if any
    if (this.querySub !== null) {
      this.querySub.unsubscribe();
      this.querySub = null;
    }

    // Start loading state
    this.setState({
      error: null,
      fetching: true,
    });

    // Reset local query keys
    this.queryKeys = {};

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
          // Store the result's key
          this.queryKeys[result.operation.key] = true;

          // Update data
          this.setState({
            data: result.data || null,
            error: result.error,
            fetching: false,
            loaded: true,
          });
        },
      });
    } else {
      const partialData = [];
      const queries$ = this.query.map(query =>
        client.executeQuery$(query, skipCache).map(result => {
          // Store the response's query key
          this.queryKeys[result.operation.key] = true;

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
                this.props.cacheInvalidation;

              if (invalidate) {
                const cacheKeys = Object.keys(this.queryKeys);
                // Protect this component from refetching any data that it received from its subscriptions
                this.queryKeys = {};
                // Invalidate all data since the subscriptions indicate a change
                // NOTE: This assumes that query and subscription belong together
                this.props.client.deleteCacheKeys(cacheKeys);
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
    return typeof this.props.children === 'function'
      ? this.props.children({
          ...this.state,
          ...this.mutations,
          client: this.props.client,
          refetch: this.fetch,
        })
      : null;
  }
}
