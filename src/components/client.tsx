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

  query = null; // Stored Query
  mutations = {}; // Stored Mutation
  typeNames = []; // Typenames that exist on current query
  subscriptionID = null; // Change subscription ID

  componentDidMount() {
    // If query exists
    if (this.props.query) {
      // And is an array
      if (Array.isArray(this.props.query)) {
        // Loop through and add typenames
        this.query = this.props.query.map(formatTypeNames);
      } else {
        // Add typenames
        this.query = formatTypeNames(this.props.query);
      }
      // Subscribe to change listener
      this.subscriptionID = this.props.client.subscribe(this.update);
      // Fetch initial data
      this.fetch(undefined, true);
    }
    // If mutation exists and has keys
    if (this.props.mutation) {
      // Loop through and add typenames
      Object.keys(this.props.mutation).forEach(key => {
        this.mutations[key] = formatTypeNames(this.props.mutation[key]);
      });
      // bind to mutate
      Object.keys(this.mutations).forEach(m => {
        const query = this.mutations[m].query;
        this.mutations[m] = variables => {
          this.mutate({
            query,
            variables: {
              ...this.mutations[m].variables,
              ...variables,
            },
          });
        };
      });
    }
  }

  componentWillUnmount() {
    // Unsub from change listener
    this.props.client.unsubscribe(this.subscriptionID);
  }

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

  fetch = async (
    opts: ClientFetchOpts = { skipCache: false },
    initial?: boolean
  ) => {
    const { client } = this.props;
    const { skipCache } = opts;
    // If query is not an array
    if (!Array.isArray(this.query)) {
      // Start loading state
      this.setState({
        fetching: true,
        error: null,
      });
      try {
        // Fetch the query
        const result = await client.executeQuery(this.query, skipCache);
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
      } catch (e) {
        this.setState({
          fetching: false,
          error: e,
        });
      }
    } else {
      // Start fetching state
      this.setState({
        fetching: true,
        error: null,
      });
      try {
        // Iterate over and fetch queries
        const dataResults = await Promise.all(
          this.query.map(async query => {
            const result = await client.executeQuery(query, skipCache);
            if (result.typeNames) {
              // Add and dedupe typenames
              this.typeNames = [...this.typeNames, ...result.typeNames].filter(
                (v, i, a) => a.indexOf(v) === i
              );
            }
            return result.data;
          })
        );

        // Combine results
        this.setState({
          fetching: false,
          data: dataResults,
        });
      } catch (e) {
        this.setState({
          fetching: false,
          error: e,
        });
      }
    }
  };

  mutate = async mutation => {
    const { client } = this.props;
    // Set fetching state
    this.setState({
      fetching: true,
      error: null,
    });
    try {
      // Execute mutation
      await client.executeMutation(mutation);
      this.setState({
        fetching: false,
      });
    } catch (e) {
      this.setState({
        fetching: false,
        error: e,
      });
    }
  };

  render() {
    return this.props.render({
      ...this.state,
      ...this.mutations,
      refetch: this.fetch,
    });
  }
}
