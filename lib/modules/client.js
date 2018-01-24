"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _hash = require("./hash");

var _typenames = require("../modules/typenames");

var _v = _interopRequireDefault(require("uuid/v4"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

class Client {
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
    Object.defineProperty(this, "updateSubscribers", {
      configurable: true,
      enumerable: true,
      writable: true,
      value: typenames => {
        for (let sub in this.subscriptions) {
          this.subscriptions[sub](typenames);
        }
      }
    });
    this.url = opts.url || null;
    this.fetchOptions = opts.fetchOptions || {};
    this.store = {};
    this.subscriptions = {};
    this.executeQuery = this.executeQuery.bind(this);
    this.executeMutation = this.executeMutation.bind(this);
  }

  subscribe(callback) {
    const id = (0, _v.default)();
    this.subscriptions[id] = callback;
    return id;
  }

  unsubscribe(id) {
    delete this.subscriptions[id];
  }

  executeQuery(queryObject, skipCache) {
    return new Promise(resolve => {
      const {
        query,
        variables
      } = queryObject;
      const body = JSON.stringify({
        query,
        variables
      });
      const hash = (0, _hash.hashString)(body);

      if (this.store[hash] && !skipCache) {
        resolve({
          data: this.store[hash]
        });
      } else {
        fetch(this.url, _extends({
          method: 'POST',
          body: body,
          headers: {
            'Content-Type': 'application/json'
          }
        }, this.fetchOptions)).then(res => res.json()).catch(error => resolve(error)).then(response => {
          if (response.data) {
            const typeNames = (0, _typenames.gankTypeNamesFromResponse)(response.data);
            this.store[hash] = response.data;
            resolve({
              data: response.data,
              typeNames
            });
          }
        });
      }
    });
  }

  executeMutation(mutationObject) {
    return new Promise(resolve => {
      const {
        query,
        variables
      } = mutationObject;
      const body = JSON.stringify({
        query,
        variables
      });
      fetch(this.url, _extends({
        method: 'POST',
        body: body,
        headers: {
          'Content-Type': 'application/json'
        }
      }, this.fetchOptions)).then(res => res.json()).catch(error => resolve(error)).then(response => {
        const typeNames = (0, _typenames.gankTypeNamesFromResponse)(response.data);
        this.updateSubscribers(typeNames);
        resolve(response.data);
      });
    });
  }

}

exports.default = Client;