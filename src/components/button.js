import styled from "styled-components";

export const Button = styled.a`
  background: ${props => props.light ? "white" : "#202020"};
  color: ${props => props.light ? "#202020" : "white"};
  display: block;
  font-size: 1.5rem;
  height: 4rem;
  line-height: 4rem;
  margin: ${props => props.noMargin ? "0" : "5rem auto 3rem"};
  max-width: 21rem;
  min-width: 10rem;
  text-align: center;
  text-transform: uppercase;
  transition: background 0.4s;
  width: 100%;
  &:hover {
    background: ${props => props.light ? "#999" : "#333"};
  }
`;
