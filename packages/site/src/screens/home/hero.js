import React, { useCallback } from 'react';
import { Link as ReactRouterLink } from 'react-router-dom';

import { Wrapper } from '../../components/wrapper';
import { Button } from '../../components/button';
import { Link } from '../../components/link';
import styled from 'styled-components';

import badge from '../../assets/sidebar-badge.svg';

const WrapperStyled = styled(Wrapper)`
  z-index: 1;
`;

const HeroContent = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  margin-top: 5rem;
  padding: 0;
  position: relative;
  text-align: left;
  width: 100%;
  @media (min-width: 768px) {
    flex-direction: row;
    margin-top: 20rem;
    padding-left: 32rem;
  }
`;

const HeroTitle = styled.h1`
  font-size: 5rem;
  margin: 0 0 2rem;
  text-align: center;
  text-transform: uppercase;
  width: 100%;
  color: #fff;

  @media (min-width: 768px) {
    font-size: 5.8rem;
    margin: 4rem 0 2rem;
    text-align: left;
  }
`;

const HeroBody = styled.p`
  font-size: 2rem;
  line-height: 3rem;
  text-align: left;
  width: 100%;
  margin-top: 0;
  margin-bottom: 0;
  @media (min-width: 768px) {
    margin: 0 0 6rem;
    max-width: 50rem;
  }
`;

const HeroLogoContainer = styled.div`
  display: flex;
  width: 100%;
  margin: 6rem 0;
  height: 160px;
  @media (min-width: 768px) {
    height: auto;
    display: block;
    width: inherit;
    margin: 0;
  }
`;

const HeroLogo = styled.img`
  width: 20rem;
  margin: auto;
  @media (min-width: 768px) {
    left: -3rem;
    max-width: 32rem;
    position: absolute;
    top: 0;
    width: 100%;
  }
`;

const HeroButtonsWrapper = styled.div`
  max-width: 100%;
  flex-direction: column;
  justify-content: center;
  display: flex;
  @media (min-width: 1024px) {
    flex-direction: row;
  }
  @media (max-width: 768px) {
    align-items: center;
  }
`;
const HeroNPMWrapper = styled.div`
  flex-direction: row;
  justify-content: center;
  display: none;
  width: 30rem;
  @media (min-width: 768px) {
    display: flex;
  }
  @media (min-width: 1024px) {
    width: 28rem;
  }
`;

const HeroNPMCopy = styled.p`
  width: 22rem;
  height: 4rem;
  color: #383838;
  background-color: #d5d5d5;
  color: black;
  text-align: left;
  padding: 0.33rem 1.5rem;
  line-height: 3.44rem;
  font-size: 14px;
  margin: 0;
`;
const HeroNPMButton = styled(Button)`
  width: 8rem;
  cursor: copy;
  text-decoration: none;
`;

export const HeroDocsButton = styled(Link)`
  width: 30rem;
  margin-top: 4rem;
  @media (min-width: 768px) {
    margin-top: 2rem;
    width: 30rem;
  }
  @media (min-width: 1024px) {
    margin-top: 0;
    margin-left: 2rem;
    width: 18rem;
  }
`;

const HeroNavList = styled.ul`
  border-top: 2px solid #707070;
  margin-top: 2rem;
  display: flex;
  flex-direction: row;
  list-style: none;
  padding: 2rem 0 0;
  text-align: center;
  width: 100%;
  justify-content: space-around;

  & li {
    display: inline-block;
    margin-right: 33px;
  }
  & li:last-child {
    margin-right: 0;
  }
  & li a {
    color: white;
    display: inline-block;
    font-size: 1.7rem;
    transition: opacity 0.4s;
    text-transform: uppercase;
    text-decoration: none;
  }
  & li a:hover {
    color: #8196ff;
  }
  @media (min-width: 768px) {
    display: inline-block;
    border-top: 2px solid #ffffff;
    padding-top: 4rem;
    margin: 4rem 0 0 0;
    & li {
      margin-right: 66px;
    }
  }
  @media (min-width: 1024px) {
    width: 48rem;
    margin: 4rem 0 0 32rem;
  }
`;

const copyFallBack = copyText => {
  const copyTextArea = document.createElement('textArea');
  copyTextArea.value = copyText;

  document.body.appendChild(copyTextArea);

  copyTextArea.focus();
  copyTextArea.select();
  document.execCommand('copy');
  copyTextArea.remove();
};

const Hero = props => {
  const handleCopy = useCallback(
    e => {
      if (!navigator.clipboard) {
        copyFallBack(props.content.copyText);
        e.preventDefault();
        return;
      }
      navigator.clipboard.writeText(props.content.copyText);
    },
    [props.content.copyText]
  );

  return (
    <WrapperStyled noPadding>
      <HeroContent>
        <HeroLogoContainer>
          <HeroLogo src={badge} />
        </HeroLogoContainer>
        <HeroTitle>urql</HeroTitle>
        <HeroBody>
          The highly customizable and versatile GraphQL client for React,
          Svelte, Vue, or plain JavaScript, with which you add on features like
          normalized caching as you grow.
        </HeroBody>
        <HeroButtonsWrapper>
          <HeroNPMWrapper>
            <HeroNPMCopy>{props.content.copyText}</HeroNPMCopy>
            <HeroNPMButton onClick={handleCopy}>copy</HeroNPMButton>
          </HeroNPMWrapper>
          <HeroDocsButton to="docs/">Documentation</HeroDocsButton>
        </HeroButtonsWrapper>
      </HeroContent>
      <HeroNavList>
        <li>
          <ReactRouterLink to="docs/">Docs</ReactRouterLink>
        </li>
        <li>
          <a
            title="Issues"
            href="https://www.github.com/urql-graphql/urql/issues"
          >
            Issues
          </a>
        </li>
        <li>
          <a title="GitHub" href="https://github.com/urql-graphql/urql">
            GitHub
          </a>
        </li>
      </HeroNavList>
    </WrapperStyled>
  );
};

export default Hero;
