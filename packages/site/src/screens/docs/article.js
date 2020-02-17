import React from 'react';
import styled from 'styled-components';

import { MDXComponents } from '../../components/mdx';

const Container = styled.article.attrs(() => ({
  className: 'page-content',
}))`
  max-width: 80rem;
  min-height: 100vh;
  width: 100%;
  padding: 10rem 6rem 4rem 8rem;

  @media (max-width: 768px) {
    padding: 6rem 4rem 8rem 3.5rem;
  }
`;

const Article = ({ children }) => (
  <Container className="Page-content">
    <MDXComponents>{children}</MDXComponents>
  </Container>
);

export default Article;
