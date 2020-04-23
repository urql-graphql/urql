import styled from 'styled-components';

export const BodyCopy = styled.p`
  font-size: 1.4rem;
  line-height: 2.2rem;
  width: 100%;
  text-align: center;
  ${p => p.noMargin && 'margin: 0'};
  @media (min-width: 768px) {
    font-size: 1.5rem;
    line-height: 2.4rem;
    text-align: left;
  }
`;
