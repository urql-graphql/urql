import React from 'react';
import ConnectHOC from '../../components/connect-hoc';
import renderer from 'react-test-renderer';

describe('Connect HOC', () => {
  it('should wrap its component argument with connect', () => {
    const Comp = args => <div {...args} />;
    const Wrapped = ConnectHOC()(Comp);
    // @ts-ignore
    const component = renderer.create(
      // @ts-ignore
      <Wrapped />
    );
    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should wrap its component argument with connect with functional options', () => {
    const Comp = args => <div {...args} />;
    const Wrapped = ConnectHOC(props => ({
      cache: props.cache,
    }))(Comp);
    // @ts-ignore
    const component = renderer.create(
      // @ts-ignore
      <Wrapped cache={false} />
    );
    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
