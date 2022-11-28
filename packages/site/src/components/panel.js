import React from 'react';
import styled, { css } from 'styled-components';
import constants from '../constants';

const dark = css`
  background-color: #0d1129;
`;

const light = css`
  background: ${constants.color};
  border-bottom: 1rem solid rgba(0, 0, 0, 0.4);
  box-shadow: inset 0 -1rem 0 rgba(0, 0, 0, 0.2);
`;
export const FullWidthContainer = styled.div`
  color: #e3eef8;
  display: flex;
  justify-content: center;
  ${p => (p.isLight ? light : dark)};
  ${p => p.background && `background: ${p.background}`}
`;

export const SectionWrapper = styled.div`
  flex-direction: column;
  align-items: center;
  display: flex;
  padding: 8rem 4rem;
  width: 100%;
  @media (min-width: 768px) {
    flex-direction: column;
    margin: 0 8rem;
    padding: 8rem 8rem;
  }
`;

export const PanelSectionWrapper = ({
  children,
  isLight,
  background,
  ...rest
}) => (
  <FullWidthContainer isLight={!!isLight} background={background} {...rest}>
    <SectionWrapper>{children}</SectionWrapper>
  </FullWidthContainer>
);
