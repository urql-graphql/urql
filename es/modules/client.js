function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

import { hashString } from "./hash";
import { gankTypeNamesFromResponse } from "../modules/typenames";
import uuidv4 from 'uuid/v4'; // Response from executeQuery call

class Client {
  // Graphql API URL
  // Internal store
  // Options for fetch call
  // Map of subscribed Connect components
  constructor(opts) {
    Object.defineProperty(this, "url", {
      configurable: true,
      enumerable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "store", {
      configurable: true,
      enumerable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "fetchOptions", {
      configurable: true,
      enumerable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "subscriptions", {
      configurable: true,
      enumerable: true,
      writable: true,
      value: void 0
    });
    // Set option/internal defaults
    this.url = opts.url || null;
    this.fetchOptions = opts.fetchOptions || {};
    this.store = {};
    this.subscriptions = {}; // Bind methods

    this.executeQuery = this.executeQuery.bind(this);
    this.executeMutation = this.executeMutation.bind(this);
    this.updateSubscribers = this.updateSubscribers.bind(this);
  }

  updateSubscribers(typenames, changes) {
    // On mutation, call subscribed callbacks with eligible typenames
    for (let sub in this.subscriptions) {
      this.subscriptions[sub](typenames, changes);
    }
  }

  subscribe(callback) {
    // Create an identifier, add callback to subscriptions, return identifier
    const id = uuidv4();
    this.subscriptions[id] = callback;
    return id;
  }

  unsubscribe(id) {
    // Delete from subscriptions by identifier
    delete this.subscriptions[id];
  }

  executeQuery(queryObject, skipCache) {
    return new Promise(async (resolve, reject) => {
      const {
        query,
        variables
      } = queryObject; // Create query POST body

      const body = JSON.stringify({
        query,
        variables
      }); // Create hash from serialized body

      const hash = hashString(body); // Check cache for hash

      if (this.store[hash] && !skipCache) {
        resolve({
          data: this.store[hash]
        });
      } else {
        try {
          // Fetch data
          const result = await fetch(this.url, _extends({
            method: 'POST',
            body: body,
            headers: {
              'Content-Type': 'application/json'
            }
          }, this.fetchOptions));
          const response = await result.json();

          if (response.data) {
            var _response$data;

            // Grab typenames from response data
            const typeNames = (_response$data = response.data, gankTypeNamesFromResponse(_response$data)); // Store data in cache, using serialized query as key

            this.store[hash] = response.data;
            resolve({
              data: response.data,
              typeNames
            });
          } else {
            reject({
              message: 'No data'
            });
          }
        } catch (e) {
          reject(e);
        }
      }
    });
  }

  executeMutation(mutationObject) {
    return new Promise(async (resolve, reject) => {
      const {
        query,
        variables
      } = mutationObject; // Convert POST body to string

      const body = JSON.stringify({
        query,
        variables
      });

      try {
        // Call mutation
        const result = await fetch(this.url, _extends({
          method: 'POST',
          body: body,
          headers: {
            'Content-Type': 'application/json'
          }
        }, this.fetchOptions));
        const response = await result.json();

        if (response.data) {
          var _ref, _response$data2;

          // Retrieve typenames from response data
          // Notify subscribed Connect wrappers
          _ref = (_response$data2 = response.data, gankTypeNamesFromResponse(_response$data2)), this.updateSubscribers(_ref, response);
          resolve(response.data);
        } else {
          reject({
            message: 'No data'
          });
        }
      } catch (e) {
        reject(e);
      }
    });
  }

}

export { Client as default };