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
  }

  html {
    background: ${({ theme }) => theme.color.black};
    box-sizing: border-box;
    font-size: 62.5%;
    overflow-x: hidden;
  }

  body {
    background: ${({ theme }) => theme.color.white};
    color: ${({ theme }) => theme.color.darkGray};
    text-rendering: optimizeLegibility;
    font-family: ${systemFonts.join(', ')};
    font-size: 1.8rem;
    font-weight: 400;
    line-height: 1.5;
    margin: 0;
    padding: 0;
  }

  p, h1, h2, h3 {
    margin: 0 0 2.7rem 0;
  }

  h1, h2, h3 {
    font-weight: 500;
    line-height: 1.1;
  }

  h1 {
    font-size: 2.556em;
  }

  h2 {
    font-size: 1.755em;
  }

  h3 {
    font-size: 1.455em;
  }

  img {
    max-width: 100%;
  }
`;
