import React from 'react';
import styled from 'styled-components';
import { MDXProvider } from '@mdx-js/react';

import Highlight, { Prism } from 'prism-react-renderer';
import nightOwlLight from 'prism-react-renderer/themes/nightOwlLight';

const getLanguage = className => {
  const res = className.match(/language-(\w+)/);
  return res ? res[1] : null;
};

const Pre = styled.pre`
  background: ${p => p.theme.colors.passiveBg};
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

const InlineCode = styled.code`
  background: ${p => p.theme.colors.passiveBg};
  color: ${p => p.theme.colors.code};
  font-family: ${p => p.theme.fonts.code};
  font-size: ${p => p.theme.fontSizes.code};
  border-radius: ${p => p.theme.spacing.xs};

  display: inline-block;
  vertical-align: baseline;
  font-variant-ligatures: none;
  font-feature-settings: normal;
  padding: 0 0.2em;
  margin: 0;
`;

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
        <Pre className={className} style={style}>
          <Code>
            {tokens.map((line, i) => (
              <div {...getLineProps({ line, key: i })}>
                {line.map((token, key) => (
                  <span {...getTokenProps({ token, key })} />
                ))}
              </div>
            ))}
          </Code>
        </Pre>
      )}
    </Highlight>
  );
};

const components = {
  inlineCode: InlineCode,
  code: HighlightCode,
};

export const MDXComponents = ({ children }) => (
  <MDXProvider components={components}>{children}</MDXProvider>
);
