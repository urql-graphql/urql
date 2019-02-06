import styled from "styled-components";

export const Markdown = styled.article`
  width: 60vw;
  & h1 {
    font-family: "sharp";
    font-size: 3.4rem;
    margin: 0 0 2rem;

    @media (min-width: 1024px) {
      font-size: 4.8rem;
    }

    @media (max-width: 768px) {
      margin: 6rem 0 2rem;
    }
  }

  & h2 {
    font-family: "sharp";
    font-size: 2.4rem;
    margin: 6rem 0 2rem;
    @media (min-width: 1024px) {
      font-size: 2.2rem;
    }
  }

  & h3 {
    font-family: "sharp";
    font-size: 1.8rem;
    margin: 2rem 0;
    @media (min-width: 1024px) {
      font-size: 2rem;
    }
  }

  & table {
    border-collapse: collapse;
  }

  & td {
    height: 50px;
    text-align: left;
  }

  & td,
  th {
    padding: 15px;
  }

  & th {
    text-align: center;
  }

  & table,
  th,
  td {
    font-size: 1.7rem;
    font-family: "tiempos";
    tr:nth-child(even) {
      background-color: #f2f2f2;
    }
    border: 1px solid lightgrey;
  }

  & pre {
    line-height: 2rem;
    background-color: #efefef;
    padding: 2rem;
    color: #333;
  }

  & pre code {
    padding: 10px;
    color: #333;
  }

  & p {
    font-family: "tiempos";
    font-size: 1.7rem;
    line-height: 1.6;
  }

  & p code {
    border: 1px solid lightgrey;
    opacity: 0.8;
    padding: 0.5rem;
    margin: 0 0.5rem 0 0.5rem;
  }

  & li {
    font-family: "tiempos";
    font-size: 1.6rem;
    padding: 0.5rem;
  }

  & a {
    color: #895160;

    &:target {
      display: block;
      position: relative;
      top: -60px;
      visibility: hidden;
    }
    &:hover {
      color: black;
      text-decoration: underline;
    }
  }
`;
