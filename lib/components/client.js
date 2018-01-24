"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = require("react");

var _typenames = require("../modules/typenames");

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

class UrqlClient extends _react.Component {
  constructor(...args) {
    var _temp;

    return _temp = super(...args), Object.defineProperty(this, "state", {
      configurable: true,
      enumerable: true,
      writable: true,
      value: {
        fetching: false,
        loaded: false,
        error: null,
        data: null
      }
    }), Object.defineProperty(this, "query", {
      configurable: true,
      enumerable: true,
      writable: true,
      value: null
    }), Object.defineProperty(this, "mutations", {
      configurable: true,
      enumerable: true,
      writable: true,
      value: {}
    }), Object.defineProperty(this, "typeNames", {
      configurable: true,
      enumerable: true,
      writable: true,
      value: []
    }), Object.defineProperty(this, "subscriptionID", {
      configurable: true,
      enumerable: true,
      writable: true,
      value: null
    }), Object.defineProperty(this, "update", {
      configurable: true,
      enumerable: true,
      writable: true,
      value: (changedTypes, response) => {
        let invalidated = false;

        if (this.props.shouldInvalidate) {
          invalidated = this.props.shouldInvalidate(changedTypes, this.typeNames, response, this.state.data);
        } else {
          // Check connection typenames, derived from query, for presence of mutated typenames
          this.typeNames.forEach(typeName => {
            if (changedTypes.indexOf(typeName) !== -1) {
              invalidated = true;
            }
          });
        } // If it has any of the type names that changed


        if (invalidated) {
          // Refetch the data from the server
          this.fetch({
            skipCache: true
          });
        }
      }
    }), Object.defineProperty(this, "fetch", {
      configurable: true,
      enumerable: true,
      writable: true,
      value: async (opts = {
        skipCache: false
      }, initial) => {
        const {
          client
        } = this.props;
        const {
          skipCache
        } = opts; // If query is not an array

        if (!Array.isArray(this.query)) {
          // Start loading state
          this.setState({
            fetching: true,
            error: null
          });

          try {
            // Fetch the query
            const result = await client.executeQuery(this.query, skipCache); // Store the typenames

            if (result.typeNames) {
              this.typeNames = result.typeNames;
            } // Update data


            this.setState({
              fetching: false,
              loaded: initial ? true : this.state.loaded,
              data: result.data
            });
          } catch (e) {
            this.setState({
              fetching: false,
              error: e
            });
          }
        } else {
          // Start fetching state
          this.setState({
            fetching: true,
            error: null
          });

          try {
            // Iterate over and fetch queries
            const dataResults = await Promise.all(this.query.map(async query => {
              const result = await client.executeQuery(query, skipCache);

              if (result.typeNames) {
                // Add and dedupe typenames
                this.typeNames = [...this.typeNames, ...result.typeNames].filter((v, i, a) => a.indexOf(v) === i);
              }

              return result.data;
            })); // Combine results

            this.setState({
              fetching: false,
              data: dataResults
            });
          } catch (e) {
            this.setState({
              fetching: false,
              error: e
            });
          }
        }
      }
    }), Object.defineProperty(this, "mutate", {
      configurable: true,
      enumerable: true,
      writable: true,
      value: async mutation => {
        const {
          client
        } = this.props; // Set fetching state

        this.setState({
          fetching: true,
          error: null
        });

        try {
          // Execute mutation
          await client.executeMutation(mutation);
          this.setState({
            fetching: false
          });
        } catch (e) {
          this.setState({
            fetching: false,
            error: e
          });
        }
      }
    }), _temp;
  }

  // Change subscription ID
  componentDidMount() {
    // If query exists
    if (this.props.query) {
      // And is an array
      if (Array.isArray(this.props.query)) {
        // Loop through and add typenames
        this.query = this.props.query.map(_typenames.formatTypeNames);
      } else {
        // Add typenames
        this.query = (0, _typenames.formatTypeNames)(this.props.query);
      } // Subscribe to change listener


      this.subscriptionID = this.props.client.subscribe(this.update); // Fetch initial data

      this.fetch(undefined, true);
    } // If mutation exists and has keys


    if (this.props.mutation) {
      // Loop through and add typenames
      Object.keys(this.props.mutation).forEach(key => {
        this.mutations[key] = (0, _typenames.formatTypeNames)(this.props.mutation[key]);
      }); // bind to mutate

      Object.keys(this.mutations).forEach(m => {
        const query = this.mutations[m].query;

        this.mutations[m] = variables => {
          this.mutate({
            query,
            variables: _extends({}, this.mutations[m].variables, variables)
          });
        };
      });
    }
  }

  componentWillUnmount() {
    // Unsub from change listener
    this.props.client.unsubscribe(this.subscriptionID);
  }

  render() {
    return this.props.render(_extends({}, this.state, this.mutations, {
      refetch: this.fetch
    }));
  }

}

exports.default = UrqlClient;