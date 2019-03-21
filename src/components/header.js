import React from "react";
import Hero from "../screens/home/hero";
import bgImg from "../static/bg_hero_gray.jpg";
import styled from "styled-components";
import { Navigation } from "./navigation";
import { Wrapper } from "./wrapper";
import logoFormidableWhite from "../static/svgs/logo_formidable_white.svg";
const Container = styled.header`
  background: #3b3b3b url(${bgImg});
  background-size: cover;
  color: white;
  height: auto;
  padding: 0 0 9rem;
  width: 100%;
`;

const HeaderLogo = styled.img`
  position: absolute;
  right: 3rem;
  top: 1.5rem;
`;

export const Header = () => (
  <Container>
    <Navigation>
      <Wrapper noPadding>
        <a href="https://formidable.com">
          <HeaderLogo src={logoFormidableWhite} alt="Formidable Logo" />
        </a>
      </Wrapper>
    </Navigation>
    <Hero />
  </Container>
);
