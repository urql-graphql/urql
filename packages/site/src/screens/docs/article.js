import React from 'react';
import styled from 'styled-components';
import { MDXProvider } from '@mdx-js/react';

import { Markdown } from '../../components/markdown';

const Container = styled.div`
  max-width: 80rem;
  min-height: 100vh;
  width: 100%;
  padding: 10rem 6rem 4rem 8rem;
  @media (max-width: 768px) {
    padding: 6rem 4rem 8rem 3.5rem;
  }
  .gatsby-highlight {
    @media (max-width: 768px) {
      margin-left: -2rem;
    }
    code {
      overflow-x: scroll;
    }
  }
`;

const hastToMdx = (node, index = 0) => {
  switch (node.type) {
    case 'text':
      return node.value;
    case 'root':
      return node.children.map(hastToMdx);
    case 'element':
      return mdx(node.tagName, {
        ...node.properties,
        children: node.children.map(hastToMdx),
        key: index,
      });
    default:
      return null;
  }
};

const Article = ({ children }) => (
  <Container className="Page-content">
    <MDXProvider>
      <Markdown>
        {children}
      </Markdown>
    </MDXProvider>
  </Container>
);

export default Article;
