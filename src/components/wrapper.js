import styled from "styled-components";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  margin: auto;
  max-width: 116rem;
  padding: ${props => props.noPadding ? "0 4rem" : "4rem"}
  text-align: center;
  width: 100%;
  @media (min-width: 768px) {
    padding: ${props => props.noPadding ? "0 8rem" : "8rem"}
  }
`;
