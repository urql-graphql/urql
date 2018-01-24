'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;

var _react = require('react');

var _typenames = require('../modules/typenames');

function _extends() {
  _extends =
    Object.assign ||
    function(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];
        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }
      return target;
    };
  return _extends.apply(this, arguments);
}

class UrqlClient extends _react.Component {
  constructor(...args) {
    var _temp;

    return (
      (_temp = super(...args)),
      Object.defineProperty(this, 'state', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: {
          loading: false,
          error: null,
          data: [],
        },
      }),
      Object.defineProperty(this, 'query', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: null,
      }),
      Object.defineProperty(this, 'queries', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: [],
      }),
      Object.defineProperty(this, 'mutation', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: {},
      }),
      Object.defineProperty(this, 'typeNames', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: null,
      }),
      Object.defineProperty(this, 'subscriptionID', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: null,
      }),
      Object.defineProperty(this, 'update', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: changedTypes => {
          let invalidated = false;
          this.typeNames.forEach(typeName => {
            if (changedTypes.indexOf(typeName) !== -1) {
              invalidated = true;
            }
          });

          if (invalidated) {
            this.fetch({
              skipCache: true,
            });
          }
        },
      }),
      Object.defineProperty(this, 'fetch', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: (
          opts = {
            skipCache: false,
          }
        ) => {
          const { client } = this.props;
          const { skipCache } = opts;

          if (!Array.isArray(this.query)) {
            this.setState({
              loading: true,
              error: null,
            });
            client.executeQuery(this.query, skipCache).then(res => {
              if (res.typeNames) {
                this.typeNames = res.typeNames;
              }

              this.setState({
                loading: false,
                data: res.data,
              });
            });
          }
        },
      }),
      Object.defineProperty(this, 'mutate', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: mutation => {
          const { client } = this.props;
          this.setState({
            loading: true,
            error: null,
          });
          client.executeMutation(mutation).then(() => {
            this.setState({
              loading: false,
            });
          });
        },
      }),
      _temp
    );
  }

  componentDidMount() {
    if (this.props.query) {
      if (Array.isArray(this.props.query)) {
        this.queries = this.props.query.map(_typenames.formatTypeNames);
      } else {
        this.query = (0, _typenames.formatTypeNames)(this.props.query);
      }

      this.subscriptionID = this.props.client.subscribe(this.update);
      this.fetch();
    }

    if (this.props.mutation && this.props.mutation.length) {
      Object.keys(this.props.mutation).forEach(key => {
        this.mutation[key] = (0, _typenames.formatTypeNames)(
          this.props.mutation[key]
        );
      });
    }
  }

  componentWillUnmount() {
    this.props.client.unsubscribe(this.subscriptionID);
  }

  render() {
    let mutations = {};

    if (this.mutation) {
      Object.keys(this.mutation).forEach(m => {
        mutations[m] = this.mutate.bind(this, this.mutation[m]);
      });
    }

    return this.props.render(
      _extends({}, this.state, mutations, {
        refetch: this.fetch,
      })
    );
  }
}

exports.default = UrqlClient;
