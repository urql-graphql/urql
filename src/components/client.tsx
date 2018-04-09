import { Component, ReactNode } from 'react';
import { IClient, IMutation, IQuery } from '../interfaces/index';
import { hashString } from '../modules/hash';
import { formatTypeNames } from '../modules/typenames';

export interface IClientProps {
  client: IClient; // Client instance
  children: (obj: object) => ReactNode; // Render prop
  query: IQuery | IQuery[]; // Query object or array of Query objects
  mutation?: IMutation; // Mutation object (map)
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
  error?: Error; // Error
  data: object[] | IClientState[]; // Data
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

  query = null; // Stored Query
  mutations = {}; // Stored Mutation
  typeNames = []; // Typenames that exist on current query
  subscriptionID = null; // Change subscription ID

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
    this.props.client.unsubscribe(this.subscriptionID);
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
    // If query exists
    if (props.query) {
      // Loop through and add typenames
      this.query = Array.isArray(props.query)
        ? props.query.map(formatTypeNames)
        : formatTypeNames(props.query);
      // Subscribe to change listener
      this.subscriptionID = props.client.subscribe(this.update);
      // Fetch initial data
      this.fetch(undefined, true);
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

  update = (changedTypes, response, refresh) => {
    if (refresh === true) {
      this.fetch();
    }
    let invalidated = false;
    if (this.props.shouldInvalidate) {
      invalidated = this.props.shouldInvalidate(
        changedTypes,
        this.typeNames,
        response,
        this.state.data
      );
    } else if (this.props.typeInvalidation !== false) {
      // Check connection typenames, derived from query, for presence of mutated typenames
      this.typeNames.forEach(typeName => {
        if (changedTypes.indexOf(typeName) !== -1) {
          invalidated = true;
        }
      });
    }
    // If it has any of the type names that changed
    if (invalidated) {
      // Refetch the data from the server
      this.fetch({ skipCache: true });
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
    // If query is not an array
    if (!Array.isArray(this.query)) {
      // Start loading state
      this.setState({
        error: null,
        fetching: true,
      });
      // Fetch the query
      client
        .executeQuery(this.query, skipCache)
        .then(result => {
          // Store the typenames
          if (result.typeNames) {
            this.typeNames = result.typeNames;
          }
          // Update data
          this.setState({
            data: result.data,
            fetching: false,
            loaded: initial ? true : this.state.loaded,
          });
        })
        .catch(e => {
          this.setState({
            error: e,
            fetching: false,
          });
        });
    } else {
      // Start fetching state
      this.setState({
        error: null,
        fetching: true,
      });
      // Iterate over and fetch queries
      const partialData = [];
      return Promise.all(
        this.query.map(query => {
          return client.executeQuery(query, skipCache).then(result => {
            if (result.typeNames) {
              // Add and dedupe typenames
              this.typeNames = [...this.typeNames, ...result.typeNames].filter(
                (v, i, a) => a.indexOf(v) === i
              );
            }
            partialData.push(result.data);
            return result.data;
          });
        })
      )
        .then(results => {
          this.setState({
            data: results,
            fetching: false,
            loaded: true,
          });
        })
        .catch(e => {
          this.setState({
            data: partialData,
            error: e,
            fetching: false,
          });
        });
    }
  };

  mutate = mutation => {
    const { client } = this.props;
    // Set fetching state
    this.setState({
      error: null,
      fetching: true,
    });

    return new Promise((resolve, reject) => {
      // Execute mutation
      client
        .executeMutation(mutation)
        .then((...args) => {
          this.setState(
            {
              fetching: false,
            },
            () => {
              resolve(...args);
            }
          );
        })
        .catch(e => {
          this.setState(
            {
              error: e,
              fetching: false,
            },
            () => {
              reject(e);
            }
          );
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
