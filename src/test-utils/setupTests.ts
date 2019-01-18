import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

// Setup enzyme adapter
configure({ adapter: new Adapter() });

// Setup globals
const g = global as any;

g.AbortController = undefined;
g.fetch = jest.fn();

process.on('unhandledRejection', error => {
  throw error;
});
