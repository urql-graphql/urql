"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireWildcard(require("react"));

var _context = require("./context");

var _client = _interopRequireDefault(require("./client"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

class Connect extends _react.Component {
  render() {
    // Use react-create-context to provide context to ClientWrapper
    return _react.default.createElement(_context.Consumer, null, client => _react.default.createElement(_client.default, {
      client: client,
      render: this.props.render,
      query: this.props.query,
      mutation: this.props.mutation,
      fetchingDelay: this.props.fetchingDelay,
      cache: this.props.cache,
      typeInvalidation: this.props.typeInvalidation,
      shouldInvalidate: this.props.shouldInvalidate
    }));
  }

}

exports.default = Connect;