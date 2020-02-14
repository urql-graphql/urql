import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
  html {
    font-size: 10px;
    box-sizing: border-box;
  }

  * {
    box-sizing: inherit;
  }

  body {
    background: #ffffff;
    color: #3b3b3b;
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-size: 1.3rem;
    letter-spacing: -0.03em;
    margin: 0;
    padding: 0;
  }

  p {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    letter-spacing: -0.03em;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    letter-spacing: 0;
    font-weight: 500;
  }

  h1 {
    font-size: 5rem;
  }

  a {
    text-decoration: none;
  }

  img {
    max-width: 100%;
  }
`;
