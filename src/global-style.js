import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
  

  :root {
    font-size: 10px;
  }

  html {
    box-sizing: border-box;
  }

  * {
    box-sizing: inherit;
  }

  body {
    background: #8196ff;
    color: #3b3b3b;
    font-family: "Helvetica", sans-serif;
    font-size: 1.3rem;
    letter-spacing: -0.03em;
    margin: 0;
    padding: 0;
  }
  
  p {
    font-family: "Helvetica";
    letter-spacing: -0.03em;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: "Helvetica";
    letter-spacing: 0;
  }

  a {
    text-decoration: none;
  }

  img {
    max-width: 100%;
  }
`;
