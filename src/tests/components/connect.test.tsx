import React from 'react';
import Connect from '../../components/connect';
import renderer from 'react-test-renderer';

describe('Client Component', () => {
  it('should provide a context consumer and pass through to client', () => {
    // @ts-ignore
    const component = renderer.create(
      <Connect render={args => <div {...args} />} />
    );
    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
