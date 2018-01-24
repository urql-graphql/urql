"use strict";

var _client = _interopRequireDefault(require("./client"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

test('it can be instantiated', () => {
  const client = new _client.default();
  expect(client).toBeTruthy();
});
test('it returns a client instance', () => {
  const client = new _client.default({
    url: 'test'
  });
  expect(client.url).toMatch('test');
});