import React from "react";
import Hero from "../screens/home/hero";
import bgImg from "../../public/static/svgs/urqlbackground.svg";
import styled from "styled-components";
import { Navigation } from "./navigation";
import { Wrapper } from "./wrapper";
import logoFormidableWhite from "../static/svgs/logo_formidable_white.svg";
const Container = styled.header`
  background: #3b3b3b url(${bgImg});
  background-size: 100% 100%;
  color: white;
  height: 100%;
  padding: 0 0 9rem;
  width: 100%;
`;

const HeaderLogo = styled.img`
  position: absolute;
  left: 1.5rem;
  top: 1.5rem;
  width: 100px;
`;

export const Header = () => (
  <Container>
    <a href="https://formidable.com" title="Formidable">
      <HeaderLogo src={logoFormidableWhite} alt="Formidable Logo" />
    </a>
    <Hero />
  </Container>
);

/** <Navigation>
      <Wrapper noPadding>
        <a href="https://formidable.com" title="Formidable">
          <HeaderLogo src={logoFormidableWhite} alt="Formidable Logo" />
        </a>
      </Wrapper>
</Navigation> 
*/
