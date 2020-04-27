import React from 'react';
import styled, { css } from 'styled-components';

export const buttonLinkStyling = css`
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

const ButtonNoBorder = styled.button`
  border: none;
`;

export const Button = styled(props => (
  <ButtonNoBorder {...props}>{props.children}</ButtonNoBorder>
))`
  ${buttonLinkStyling}
`;
