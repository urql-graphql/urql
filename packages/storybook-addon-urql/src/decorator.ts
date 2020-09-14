const isReact = Boolean(require('@storybook/react')); // eslint-disable-line

export const urqlDecorator = (() => {
  if (isReact) {
    return require('./decorators/react').default;
  }

  require('./decorators/react').default;
})();
