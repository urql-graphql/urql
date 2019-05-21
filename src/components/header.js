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
  padding: 0 0 9rem;
  width: 100%;
  @media (min-width: 768px) {
    background-image: url(${bgImg});
  }
`;

const HeaderLogo = styled.img`
  position: absolute;
  left: 0.5rem;
  top: 0.5rem;
  width: 70px;
  @media (min-width: 768px) {
    left: 1.5rem;
    top: 1.5rem;
    width: 100px;
  }
`;

export const Header = () => (
  <Container>
    <a href="https://formidable.com" title="Formidable">
      <HeaderLogo src={logoFormidableWhite} alt="Formidable Logo" />
    </a>
    <Hero />
  </Container>
);
