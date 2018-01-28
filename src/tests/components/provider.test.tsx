/* tslint:disable */

import React from 'react';
import Provider from '../../components/provider';
import renderer from 'react-test-renderer';

describe('Provider Component', () => {
  it('should provide a context consumer and pass through to client', () => {
    // @ts-ignore
    const component = renderer.create(
      // @ts-ignore
      <Provider client="test">
        <div />
      </Provider>
    );
    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
