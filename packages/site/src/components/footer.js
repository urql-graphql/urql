import React from 'react';
import { Wrapper } from './wrapper';
import styled from 'styled-components';

import logoFormidableWhite from '../assets/logo_formidable_white.svg';

const Container = styled.footer`
  background: #1f1f1f;
  color: white;
  display: flex;
  flex-direction: column;
  height: auto;
  padding: 9rem 0;
  align-items: center;
`;

const FooterDescription = styled.p`
  flex: 2;
  font-size: 1.4rem;
  line-height: 1.6;
  margin: 2rem 0 0;
  max-width: 56rem;
  text-align: left;
  @media (min-width: 768px) {
    font-size: 1.5rem;
    margin: 0;
    min-width: auto;
  }
  & a {
    color: white;
    transition: opacity 0.4s;
  }
  & a:hover {
    opacity: 0.7;
  }
  & a:visited {
    color: white;
  }
`;

const FooterLeft = styled.div`
  display: flex;
  flex: 1;
  padding: 0 4rem 0 0;
  text-align: left;
`;

const FooterLogo = styled.img`
  width: 100px;
`;

const FooterLinks = styled.ul`
  font-size: 1.4rem;
  list-style: none;
  padding: 0px 8px;
  text-transform: uppercase;

  & li {
    margin: 0.2rem 0;
  }

  & a {
    color: white;
    letter-spacing: 0.05em;
    transition: opacity 0.4s;
  }

  & a:hover {
    opacity: 0.7;
  }

  & a:visited {
    color: white;
  }
`;

export const Footer = () => (
  <Container>
    <Wrapper noPadding>
      <FooterLeft>
        <a href="https://formidable.com" title="Formidable">
          <FooterLogo src={logoFormidableWhite} alt="Formidable Logo" />
        </a>
        <FooterLinks>
          <li>
            <a href="https://formidable.com/contact/" title="Contact">
              Contact
            </a>
          </li>
          <li>
            <a href="https://formidable.com/careers/" title="Careers">
              Careers
            </a>
          </li>
        </FooterLinks>
      </FooterLeft>
      <FooterDescription>
        Formidable is a global design and engineering consultancy and open
        source software organization, specializing in React.js, React Native,
        GraphQL, Node.js, and the extended JavaScript ecosystem. We have
        locations in Seattle, London, Toronto, Denver, and Phoenix with remote
        consultants worldwide. For more information please visit{' '}
        <a
          href="https://formidable.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          formidable.com.
        </a>
      </FooterDescription>
    </Wrapper>
  </Container>
);
