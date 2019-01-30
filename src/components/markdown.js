import styled from "styled-components";

export const Markdown = styled.article`
  font-family: "akkurat";
  & h1 {
    font-size: 3.2rem;
    margin: 0 0 2rem;

    @media (min-width: 1024px) {
      font-size: 4.6rem;
    }

    @media (max-width: 768px) {
      margin: 6rem 0 2rem;
    }
  }

  & h2 {
    font-size: 2.2rem;
    margin: 6rem 0 2rem;
    @media (min-width: 1024px) {
      font-size: 2rem;
    }
  }

  & p {
    font-size: 1.5rem;
    line-height: 1.6;
  }
`;
