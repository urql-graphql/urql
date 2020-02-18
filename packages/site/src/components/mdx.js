import React from 'react';
import { MDXProvider } from '@mdx-js/react';

const components = {};

export const MDXComponents = ({ children }) => (
  <MDXProvider components={components}>{children}</MDXProvider>
);
