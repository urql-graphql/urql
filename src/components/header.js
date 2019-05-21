import React from "react";
import Hero from "../screens/home/hero";
import bgImg from "../../public/static/svgs/urqlbackground.svg";
import bgImgMobile from "../../public/static/svgs/urqlbackground-mobile.svg";
import styled from "styled-components";
import logoFormidableWhite from "../static/svgs/logo_formidable_white.svg";
const Container = styled.header`
  background-color: #3b3b3b;
  background-image: url(${bgImgMobile});
  background-size: 100% 100%;
  color: white;
  height: 100%;
  padding: 0 0 4rem;
  width: 100%;
  @media (min-width: 768px) {
    background-image: url(${bgImg});
  }
`;

const HeaderContainer = styled.a`
  display: flex;
  position: absolute;
  left: 0.5rem;
  top: 0.5rem;
  width: 13rem;
  flex-direction: column;
  color: #ffffff;
  p {
  }
`;

const HeaderText = styled.p`
  text-transform: uppercase;
  margin-left: 14px;
  line-height: 1.9rem;
`;

const HeaderLogo = styled.img`
  width: 70px;
`;

export const Header = () => (
  <Container>
    <HeaderContainer href="https://formidable.com" title="Formidable">
      <HeaderText>Another oss project by </HeaderText>
      <HeaderLogo src={logoFormidableWhite} alt="Formidable Logo" />
    </HeaderContainer>
    <Hero />
  </Container>
);
