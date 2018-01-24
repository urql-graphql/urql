"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Consumer = exports.Provider = void 0;

var _createReactContext = _interopRequireDefault(require("create-react-context"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const context = (0, _createReactContext.default)({});
const {
  Provider,
  Consumer
} = context;
exports.Consumer = Consumer;
exports.Provider = Provider;