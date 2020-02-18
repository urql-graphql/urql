import { createGlobalStyle } from 'styled-components';

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
    font-family: -apple-system, BlinkMacSystemFont, Helvetica, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
    font-size: 1.3rem;
    margin: 0;
    padding: 0;
  }

  img {
    max-width: 100%;
  }
`;
