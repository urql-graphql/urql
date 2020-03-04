import { createGlobalStyle } from 'styled-components';

const systemFonts = [
  '-apple-system',
  'BlinkMacSystemFont',
  'Segoe UI',
  'Roboto',
  'Helvetica Neue',
  'Arial',
  'Noto Sans',
  'sans-serif',
  'Apple Color Emoji',
  'Segoe UI Emoji',
  'Segoe UI Symbol',
  'Noto Color Emoji',
];

export const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: inherit;
    min-width: 0;
  }

  html {
    box-sizing: border-box;
    font-size: 62.5%;
    overflow-x: hidden;
  }

  body {
    background: ${p => p.theme.colors.passiveBg};
    color: ${p => p.theme.colors.text};
    font-family: ${p => p.theme.fonts.body};
    font-size: ${p => p.theme.fontSizes.body};
    line-height: ${p => p.theme.lineHeights.body};
    font-weight: ${p => p.theme.fontWeights.body};
    text-rendering: optimizeLegibility;
    margin: 0;
    padding: 0;
  }

  a {
    color: ${p => p.theme.colors.accent};
    font-weight: ${p => p.theme.fontWeights.links};
  }

  pre, p, h1, h2, h3 {
    margin: 0 0 ${p => p.theme.spacing.md} 0;
  }

  h1, h2, h3 {
    font-family: ${p => p.theme.fonts.heading};
    font-weight: ${p => p.theme.fontWeights.heading};
    line-height: ${p => p.theme.lineHeights.heading};
    color: ${p => p.theme.colors.heading};
  }

  h1 {
    font-size: ${p => p.theme.fontSizes.h1};
  }

  h2 {
    font-size: ${p => p.theme.fontSizes.h2};
  }

  h3 {
    font-size: ${p => p.theme.fontSizes.h3};
  }

  img {
    max-width: 100%;
  }
`;
