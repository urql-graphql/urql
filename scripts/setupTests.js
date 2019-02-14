const { configure } = require('enzyme');
const Adapter = require('enzyme-adapter-react-16');

// Setup enzyme adapter
configure({ adapter: new Adapter() });

global.AbortController = undefined;
global.fetch = jest.fn();

process.on('unhandledRejection', error => {
  throw error;
});
