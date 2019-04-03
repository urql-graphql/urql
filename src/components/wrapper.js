import styled from "styled-components";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  justify-content: space-between;
  margin: auto;
  max-width: 40rem;
  padding: ${props => (props.noPadding ? "0 4rem" : "4rem")}
  text-align: center;
  width: 100%;
  @media (min-width: 768px) {
    flex-direction: row;
    max-width: 116rem;
    padding: ${props => (props.noPadding ? "0 8rem" : "8rem")}
  }
  @media (max-width: 768px) {
    width: 65%;
    text-align: center;
    img {
      max-width: 240px;
    }
    p {
      text-align: left;
    }
  }
`;
