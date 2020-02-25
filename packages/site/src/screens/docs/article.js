import React from 'react';
import styled from 'styled-components';
import { useMarkdownPage } from 'react-static-plugin-md-pages';

import { MDXComponents } from '../../components/mdx';

const Container = styled.main.attrs(() => ({
  className: 'page-content',
}))`
  flex: 1;
  width: 100%;
  position: sticky;

  display: ${p => (p.sidebarOpen ? 'none' : 'flex')};
  flex-direction: row-reverse;
`;

const Content = styled.article.attrs(() => ({
  id: 'page-content',
}))`
  flex: 1;
  min-height: 100vh;
  margin: 0 ${p => p.theme.spacing.md};
  padding: ${p => p.theme.spacing.md} 0;
`;

const Legend = styled.aside`
  display: none;

  @media ${({ theme }) => theme.media.lg} {
    display: block;
    position: sticky;
    top: ${p => p.theme.layout.header};
    max-height: 100vh;
    width: ${p => p.theme.layout.legend};
    max-width: ${p => p.theme.layout.legendMaxWidth};
    padding: ${p => p.theme.spacing.md} 0;
    margin: ${p => p.theme.spacing.sm} ${p => p.theme.spacing.md};
  }
`;

const LegendTitle = styled.h3`
  font-size: ${p => p.theme.fontSizes.body};
  font-weight: ${p => p.theme.fontWeights.heading};
  margin-bottom: ${p => p.theme.spacing.sm};
`;

const HeadingList = styled.ul`
  list-style-type: none;
  margin: 0;
  padding-left: ${p => p.theme.spacing.sm};
  border-left: 1px solid ${p => p.theme.colors.border};
`;

const HeadingItem = styled.li`
  line-height: ${p => p.theme.lineHeights.heading};
  margin-bottom: ${p => p.theme.spacing.xs};

  > a {
    font-size: ${p => p.theme.fontSizes.small};
    font-weight: ${p => p.theme.fontWeights.body};
    color: ${p => p.theme.colors.heading};
    text-decoration: none;
    opacity: 0.7;
  }
`;

const SectionList = () => {
  const page = useMarkdownPage();
  if (!page) return null;

  const headings = page.headings.filter(x => x.depth > 1);
  if (headings.length === 0) return null;

  return (
    <>
      <LegendTitle>In this section</LegendTitle>
      <HeadingList>
        {headings.map(heading => (
          <HeadingItem key={heading.slug}>
            <a href={`#${heading.slug}`}>{heading.value}</a>
          </HeadingItem>
        ))}
      </HeadingList>
    </>
  );
};

const Article = ({ children, sidebarOpen }) => (
  <Container sidebarOpen={sidebarOpen}>
    <Legend>
      <SectionList />
    </Legend>
    <Content>
      <MDXComponents>{children}</MDXComponents>
    </Content>
  </Container>
);

export default Article;
