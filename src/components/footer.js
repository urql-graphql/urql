import React from "react";
import { Wrapper } from "./wrapper";
import styled from "styled-components";

const Container = styled.footer`
  background: #1F1F1F;
  color: white;
  display: flex;
  flex-direction: column;
  height: auto;
  padding: 9rem 0;
`;

const FooterDescription = styled.p`
  flex: 2;
  font-size: 1.4rem;
  line-height: 1.6;
  margin: 2rem 0 0;
  max-width: 56rem;
  min-width: 100%;
  text-align: left;
  @media (min-width: 768px) {
    font-size: 1.5rem;
    margin: 0;
    min-width: auto;
  }
`;

const FooterLeft = styled.div`
  flex: 1;
  padding: 0 4rem 0 0;
  text-align: left;
`;

const FooterLogo = styled.img`
  min-width: 21rem;
`;

const FooterLinks = styled.ul`
  font-size: 1.4rem;
  list-style: none;
  padding: 0;
  text-transform: uppercase;
  & li {
    margin-bottom: 1.4rem;
  }
  & a {
    color: white;
    letter-spacing: 0.05em;
    transition: opacity 0.4s;
  }
  & a:hover {
    opacity: 0.7;
  }
`;

export const Footer = () => (
  <Container>
    <Wrapper noPadding>
      <FooterLeft>
        <FooterLogo src="../static/svgs/logo_formidable_white.svg" alt="Formidable Logo" />
        <FooterLinks>
          <li><a href="#" title="Contact">Contact</a></li>
          <li><a href="#" title="Careers">Careers</a></li>
        </FooterLinks>
      </FooterLeft>
      <FooterDescription>A little blurb about Formidable. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</FooterDescription>
    </Wrapper>
  </Container>
);
