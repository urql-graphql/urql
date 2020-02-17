import { createGlobalStyle } from 'styled-components';
import normalize from 'styled-normalize';

import prism from './prism';

export const GlobalStyle = createGlobalStyle`
    ${normalize}
    ${prism}
    html {
        background: ${({ theme }) => theme.color.black};
        box-sizing: border-box;
        font-size: 62.5%;
        overflow-x: hidden;
    }

    * {
        box-sizing: inherit;
    }

    body {
        background: ${({ theme }) => theme.color.white};
        color: ${({ theme }) => theme.color.darkGray};
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
