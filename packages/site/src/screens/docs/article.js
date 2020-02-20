import React from 'react';
import styled from 'styled-components';

import { MDXComponents } from '../../components/mdx';

const Container = styled.article.attrs(() => ({
  className: 'page-content',
}))`
  flex: 1;
  min-height: 100vh;
  width: 100%;
  padding: ${p => p.theme.spacing.md};
`;

const Article = ({ children }) => (
  <Container className="Page-content">
    <MDXComponents>{children}</MDXComponents>
  </Container>
);

export default Article;
