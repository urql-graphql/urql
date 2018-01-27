import { Component, ReactNode } from 'react';
import { Client, Query, Mutation } from '../interfaces/index';
import { formatTypeNames } from '../modules/typenames';

export interface ClientProps {
  client: Client; // Client instance
  render: (object) => ReactNode; // Render prop
  query: Query | Array<Query>; // Query object or array of Query objects
  mutation?: Mutation; // Mutation object (map)
  fetchingDelay?: number;
  cache?: boolean;
  typeInvalidation?: boolean;
  shouldInvalidate?: (
    changedTypes: Array<string>,
    typeNames: Array<string>,
    response: object,
    data: object
  ) => boolean;
}

export type ClientFetchOpts = {
  skipCache: Boolean; // Should skip cache?
};

export interface ClientState {
  fetching: boolean; // Loading
  loaded: boolean; // Initial load
  error?: Error; // Error
  data: Array<object> | Array<ClientState>; // Data
}

export default class UrqlClient extends Component<ClientProps, ClientState> {
  state = {
    fetching: false,
    loaded: false,
    error: null,
    data: null,
  };

  static defaultProps = {
    cache: true,
    typeInvalidation: true,
  };

  query = null; // Stored Query
  mutations = {}; // Stored Mutation
  typeNames = []; // Typenames that exist on current query
  subscriptionID = null; // Change subscription ID

  componentDidMount() {
    this.formatProps(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (
      this.props.query !== nextProps.query ||
      this.props.mutation !== nextProps.mutation
    ) {
      this.formatProps(nextProps);
    }
  }

  componentWillUnmount() {
    // Unsub from change listener
    this.props.client.unsubscribe(this.subscriptionID);
  }

  formatProps = props => {
    // If query exists
    if (props.query) {
      // And is an array
      if (Array.isArray(props.query)) {
        // Loop through and add typenames
        this.query = props.query.map(formatTypeNames);
      } else {
        // Add typenames
        this.query = formatTypeNames(props.query);
      }
      // Subscribe to change listener
      this.subscriptionID = props.client.subscribe(this.update);
      // Fetch initial data
      this.fetch(undefined, true);
    }
    // If mutation exists and has keys
    if (props.mutation) {
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

  update = (changedTypes, response) => {
    let invalidated = false;
    if (this.props.shouldInvalidate) {
      invalidated = this.props.shouldInvalidate(
        changedTypes,
        this.typeNames,
        response,
        this.state.data
      );
    } else {
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

  fetch = (opts: ClientFetchOpts = { skipCache: false }, initial?: boolean) => {
    const { client } = this.props;
    const { skipCache } = opts;
    // If query is not an array
    if (!Array.isArray(this.query)) {
      // Start loading state
      this.setState({
        fetching: true,
        error: null,
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
            fetching: false,
            loaded: initial ? true : this.state.loaded,
            data: result.data,
          });
        })
        .catch(e => {
          this.setState({
            fetching: false,
            error: e,
          });
        });
    } else {
      // Start fetching state
      this.setState({
        fetching: true,
        error: null,
      });
      // Iterate over and fetch queries
      const partialData = [];
      Promise.all(
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
            fetching: false,
            loaded: true,
            data: results,
          });
        })
        .catch(e => {
          this.setState({
            fetching: false,
            error: e,
            data: partialData,
          });
        });
    }
  };

  mutate = mutation => {
    const { client } = this.props;
    // Set fetching state
    this.setState({
      fetching: true,
      error: null,
    });
    return new Promise((resolve, reject) => {
      // Execute mutation
      client
        .executeMutation(mutation)
        .then(() => {
          this.setState(
            {
              fetching: false,
            },
            () => {
              resolve();
            }
          );
        })
        .catch(e => {
          this.setState(
            {
              fetching: false,
              error: e,
            },
            () => {
              reject(e);
            }
          );
        });
    });
  };

  render() {
    return this.props.render
      ? this.props.render({
          ...this.state,
          ...this.mutations,
          refetch: this.fetch,
        })
      : null;
  }
}
