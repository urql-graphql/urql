import React, { Component } from 'react';
import renderer from 'react-test-renderer';
import { useDevtoolsContext } from './useDevtoolsContext';

it('retrieves the component name for function components', () => {
  let hookResult;

  const TestFunComponent = () => {
    hookResult = useDevtoolsContext();
    return null;
  };

  renderer.create(React.createElement(TestFunComponent));

  expect(hookResult).toEqual({
    meta: {
      source: 'TestFunComponent',
    },
  });
});

it('prefers displayNames', () => {
  let hookResult;

  const TestFunComponent = () => {
    hookResult = useDevtoolsContext();
    return null;
  };

  TestFunComponent.displayName = 'TestFun';

  renderer.create(React.createElement(TestFunComponent));

  expect(hookResult).toEqual({
    meta: {
      source: 'TestFun',
    },
  });
});

it('retrieves the component name for function components using Query', () => {
  let hookResult;

  // We're not using the actual query component here but one with the _same name_
  const Query = () => {
    hookResult = useDevtoolsContext();
    return null;
  };

  const OuterFunComponent = () => {
    return React.createElement(Query);
  };

  renderer.create(React.createElement(OuterFunComponent));

  expect(hookResult).toEqual({
    meta: {
      source: 'OuterFunComponent',
    },
  });
});

it('retrieves the component name for class components using Query', () => {
  let hookResult;

  // We're not using the actual query component here but one with the _same name_
  const Query = () => {
    hookResult = useDevtoolsContext();
    return null;
  };

  class OuterClassComponent extends Component {
    render() {
      return React.createElement(Query);
    }
  }

  renderer.create(React.createElement(OuterClassComponent));

  expect(hookResult).toEqual({
    meta: {
      source: 'OuterClassComponent',
    },
  });
});

it('leaves a default name for unknown fibers', () => {
  let hookResult;

  // A context consumer/provider has a different Fiber type
  const TestContext = React.createContext('');

  // We're not using the actual query component here but one with the _same name_
  const Query = () => {
    hookResult = useDevtoolsContext();
    return null;
  };

  class OuterClassComponent extends Component {
    render() {
      return React.createElement(
        TestContext.Provider,
        { value: 'test' },
        React.createElement(Query)
      );
    }
  }

  renderer.create(React.createElement(OuterClassComponent));

  expect(hookResult).toEqual({
    meta: {
      source: 'Query', // the devtool hook didn't walk up the fiber tree
    },
  });
});
