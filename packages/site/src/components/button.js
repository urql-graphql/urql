import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const ButtonNoBorder = styled.button`
  border: none;
`;

export const Button = styled(({ isButton, ...rest }) =>
  isButton ? (
    <ButtonNoBorder {...rest}>{rest.children}</ButtonNoBorder>
  ) : (
    <Link {...rest} />
  )
)`
  background: white;
  color: #383838;
  font-weight: normal;
  font-size: 1.4rem;
  font-style: normal;
  font-stretch: normal;
  height: 4rem;
  line-height: 4rem;
  padding: 0 2rem;
  letter-spacing: 0.01rem;
  text-align: center;
  text-transform: uppercase;
  transition: opacity 0.4s ease-out;

  &:hover {
    opacity: 0.8;
  }
  &:active {
    opacity: 0.6;
  }
`;
