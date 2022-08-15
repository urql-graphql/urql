/* eslint-disable react-hooks/rules-of-hooks */

import React from 'react';
import { Head } from 'react-static';
import styled from 'styled-components';
import { useMarkdownPage } from 'react-static-plugin-md-pages';
import { ScrollToTop } from '../../components/scroll-to-top';

import { MDXComponents } from '../../components/mdx';

const Container = styled.main.attrs(() => ({
  className: 'page-content',
}))`
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: row-reverse;
  align-items: flex-start;
`;

const Content = styled.article.attrs(() => ({
  id: 'page-content',
}))`
  flex: 1;
  min-height: calc(100vh - ${p => p.theme.layout.header});
  background: ${p => p.theme.colors.bg};
  padding: ${p => p.theme.spacing.md};

  @media ${p => p.theme.media.lg} {
    padding: ${p => p.theme.spacing.lg};
  }

  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-word;
  hyphens: auto;
`;

const Legend = styled.aside`
  display: none;

  @media ${({ theme }) => theme.media.lg} {
    display: block;
    position: sticky;
    top: ${p => p.theme.layout.header};
    width: 100%;
    max-width: ${p => p.theme.layout.legend};
    padding: ${p => p.theme.spacing.lg} ${p => p.theme.spacing.md};
    margin: 0;
    overflow: auto;
    height: calc(100vh - ${p => p.theme.layout.header});
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
  padding: 0;
`;

const HeadingItem = styled.li`
  line-height: ${p => p.theme.lineHeights.heading};
  margin-bottom: ${p => p.theme.spacing.xs};
  margin-left: ${p => (p.depth >= 3 ? p.theme.spacing.sm : 0)};

  > a {
    font-size: ${p => p.theme.fontSizes.small};
    font-weight: ${p =>
      p.depth < 3 ? p.theme.fontWeights.links : p.theme.fontWeights.body};
    color: ${p => p.theme.colors.passive};
    text-decoration: none;
  }
`;

const SectionList = () => {
  const page = useMarkdownPage();
  if (!page || !page.headings) return null;

  const title = (page.frontmatter && page.frontmatter.title) || null;
  const headings = page.headings.filter(x => x.depth > 1);
  if (headings.length === 0) return null;

  return (
    <>
      {title && (
        <Head>
          <title>{title} | urql Documentation</title>
        </Head>
      )}
      <LegendTitle>In this section</LegendTitle>
      <HeadingList>
        {headings.map(heading => (
          <HeadingItem key={heading.slug} depth={heading.depth}>
            <a href={`#${heading.slug}`}>{heading.value}</a>
          </HeadingItem>
        ))}
      </HeadingList>
    </>
  );
};

export const ArticleStyling = ({ children, SectionList }) => (
  <Container>
    <Legend>{SectionList && <SectionList />}</Legend>
    <Content>{children}</Content>
  </Container>
);

const Article = ({ children }) => (
  <>
    <ScrollToTop />
    <ArticleStyling SectionList={SectionList}>
      <MDXComponents>{children}</MDXComponents>
    </ArticleStyling>
  </>
);

export default Article;
