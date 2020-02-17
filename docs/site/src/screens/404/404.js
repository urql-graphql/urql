import React from 'react';
import styled from 'styled-components';

const Help = styled.h1`
  font-size: 5rem;
  letter-spacing: 0.15em;
  margin: 1.5em;
  text-align: left;
  text-transform: uppercase;
  width: 100%;
  @media (min-width: 768px) {
    font-size: 5.8rem;
  }
`;

const NotFound = props => {
  return <Help>Oops! That page was not found</Help>;
};

export default NotFound;
