import React from 'react';
import styled, { css } from 'styled-components';
import { MDXProvider } from '@mdx-js/react';

import Highlight, { Prism } from 'prism-react-renderer';
import nightOwlLight from 'prism-react-renderer/themes/nightOwlLight';

const getLanguage = className => {
  const res = className.match(/language-(\w+)/);
  return res ? res[1] : null;
};

const Pre = styled.pre`
  background: ${p => p.theme.colors.codeBg};
  border: 1px solid ${p => p.theme.colors.border};
  line-height: ${p => p.theme.lineHeights.code};
  font-size: ${p => p.theme.fontSizes.code};
  padding: ${p => p.theme.spacing.sm};
  border-radius: ${p => p.theme.spacing.xs};
  -webkit-overflow-scrolling: touch;
  overflow-x: auto;
  position: relative;
  max-width: 100%;
`;

const Code = styled.code`
  display: block;
  font-family: ${p => p.theme.fonts.code};
  color: ${p => p.theme.colors.code};
  font-variant-ligatures: none;
  font-feature-settings: normal;
  white-space: pre;
`;

const InlineCode = styled(props => {
  const children = props.children.replace(/\\\|/g, '|');
  return <code {...props}>{children}</code>;
})`
  background: ${p => p.theme.colors.codeBg};
  color: ${p => p.theme.colors.code};
  font-family: ${p => p.theme.fonts.code};
  font-size: ${p => p.theme.fontSizes.small};
  border-radius: ${p => p.theme.spacing.xs};

  display: inline-block;
  vertical-align: baseline;
  font-variant-ligatures: none;
  font-feature-settings: normal;
  padding: 0 0.2em;
  margin: 0;

  a > & {
    text-decoration: underline;
  }
`;

const ImageWrapper = styled.div`
  margin: ${p => p.theme.spacing.md} 0;
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: ${p => p.theme.spacing.xs};
  background: ${p => p.theme.colors.bg};

  display: flex;
  flex-direction: column;

  & > img {
    padding: ${p => p.theme.spacing.md};
    align-self: center;
    max-height: 40vh;
  }
`;

const ImageAlt = styled.span.attrs(() => ({
  'aria-hidden': true, // This is just duplicating alt
}))`
  display: block;
  padding: ${p => p.theme.spacing.xs} ${p => p.theme.spacing.sm};
  border-top: 1px solid ${p => p.theme.colors.border};
  background: ${p => p.theme.colors.codeBg};
  font-size: ${p => p.theme.fontSizes.small};
`;

const Image = ({ alt, src }) => (
  <ImageWrapper>
    <img alt={alt} src={src} />
    <ImageAlt>{alt}</ImageAlt>
  </ImageWrapper>
);

const HighlightCode = ({ className = '', children }) => {
  const language = getLanguage(className);

  return (
    <Highlight
      Prism={Prism}
      theme={nightOwlLight}
      code={children.trim()}
      language={language}
    >
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <Code
          style={{ ...style, backgroundColor: 'none' }}
          className={className}
        >
          {tokens.map((line, i) => (
            <div {...getLineProps({ line, key: i })}>
              {line.map((token, key) => (
                <span {...getTokenProps({ token, key })} />
              ))}
            </div>
          ))}
        </Code>
      )}
    </Highlight>
  );
};

const Blockquote = styled.blockquote`
  margin: ${p => p.theme.spacing.md} 0;
  padding: 0 0 0 ${p => p.theme.spacing.md};
  border-left: 0.5rem solid ${p => p.theme.colors.border};
  font-size: ${p => p.theme.fontSizes.small};

  & > * {
    margin: ${p => p.theme.spacing.sm} 0;
  }
`;

const sharedTableCellStyling = css`
  padding: ${p => p.theme.spacing.xs} ${p => p.theme.spacing.sm};
  border-left: 1px solid ${p => p.theme.colors.passiveBg};
  border-bottom: 1px solid ${p => p.theme.colors.passiveBg};
`;

const TableHeader = styled.th`
  text-align: left;
  white-space: nowrap;
  ${sharedTableCellStyling}
`;

const TableCell = styled.td`
  width: min-content;
  ${sharedTableCellStyling}

  ${p => {
    const isCodeOnly = React.Children.toArray(p.children).every(
      x => x.props && x.props.mdxType === 'inlineCode'
    );
    return (
      isCodeOnly &&
      css`
        background-color: ${p.theme.colors.codeBg};

        & > ${InlineCode} {
          background: none;
          padding: 0;
          margin: 0;
        }
      `
    );
  }}

  &:last-child {
    width: max-content;
  }

  &:first-child {
    white-space: nowrap;
  }

  &:nth-child(2) {
    overflow-wrap: break-word;
    min-width: 20rem;
  }
`;

const Table = styled.table`
  width: 100%;
  border: 1px solid ${p => p.theme.colors.passiveBg};
  border-collapse: collapse;
`;

const components = {
  pre: Pre,
  img: Image,
  blockquote: Blockquote,
  inlineCode: InlineCode,
  code: HighlightCode,
  table: Table,
  th: TableHeader,
  td: TableCell,
};

export const MDXComponents = ({ children }) => (
  <MDXProvider components={components}>{children}</MDXProvider>
);
