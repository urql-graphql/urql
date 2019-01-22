import React from "react";
import Hero from "../screens/home/hero";
import bgImg from "../static/bg_hero_gray.jpg";
import styled from "styled-components";
import { Navigation, NavigationTagline } from "./navigation";
import { Wrapper } from "./wrapper";

const Container = styled.header`
  background: #3b3b3b url(${bgImg});
  background-size: cover;
  color: white;
  height: auto;
  padding: 0 0 9rem;
  width: 100%;
`;

export const Header = () => (
  <Container>
    <Navigation>
      <Wrapper noPadding>
        <NavigationTagline>Lovingly created by</NavigationTagline>
        <img
          src="./static/svgs/logo_formidable_white.svg"
          alt="Formidable Logo"
        />
      </Wrapper>
    </Navigation>
    <Hero />
  </Container>
);
