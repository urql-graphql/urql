import * as adapter from 'enzyme-adapter-react-16';
import * as enzyme from 'enzyme';

(global as any).fetch = jest.fn();

enzyme.configure({ adapter: new adapter() });
