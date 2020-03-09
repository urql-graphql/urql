import React from 'react';
import Hero from '../screens/home/hero';
import styled from 'styled-components';

import logoFormidableWhite from '../assets/logo_formidable_white.svg';
import LeftTriangles from '../assets/left-triangles.svg';
import RightTriangles from '../assets/right-triangles.svg';

const Container = styled.header`
  background: rgb(109, 117, 153);
  background: linear-gradient(
    225deg,
    rgba(109, 117, 153, 1) 0%,
    rgba(41, 45, 55, 1) 100%
  );
  background-size: 100% 100%;
  color: white;
  height: 100%;
  padding: 0 0 4rem;
  width: 100%;
  display: flex;
  justify-content: center;
  position: relative;
  overflow: hidden;
`;

const HeaderContainer = styled.a`
  display: flex;
  position: absolute;
  left: 0.25rem;
  top: 0.25rem;
  width: 12rem;
  flex-direction: column;
  color: #ffffff;
  text-decoration: none;
`;

const HeaderText = styled.p`
  text-transform: uppercase;
  font-size: 1.5rem;
  margin-left: 14px;
  line-height: 1.9rem;
  margin-bottom: 0;
`;

const HeaderLogo = styled.img`
  width: 70px;
  z-index: 1;
`;

const LeftTrianglesImg = styled.img`
  position: absolute;
  display: block;
  left: 0;
  top: 0;
  height: 80%;
  max-width: none;
`;

const RightTrianglesImg = styled.img`
  position: absolute;
  right: 0;
  bottom: 0;
  display: none;
  height: 45%;
  @media (min-width: 768px) {
    display: block;
  }
`;

export const Header = () => (
  <Container>
    <LeftTrianglesImg src={LeftTriangles} />
    <RightTrianglesImg src={RightTriangles} />

    <HeaderContainer href="https://formidable.com" title="Formidable">
      <HeaderText>Another oss project by </HeaderText>
      <HeaderLogo src={logoFormidableWhite} alt="Formidable Logo" />
    </HeaderContainer>
    <Hero />
  </Container>
);
