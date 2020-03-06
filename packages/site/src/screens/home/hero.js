import React from 'react';
import { Link } from 'react-router-dom';
import { Wrapper } from '../../components/wrapper';
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
const HeroNPMButton = styled.button`
  width: 8rem;
  height: 4rem;
  background-color: #ffffff;
  font-size: 14px;
  font-weight: normal;
  font-style: normal;
  font-stretch: normal;
  line-height: normal;
  color: #383838;
  border: 0;
  text-transform: uppercase;
  cursor: copy;
  &:hover {
    background-color: #f6f6f6;
  }
`;

export const HeroDocsButton = styled(Link)`
  width: 30rem;
  margin-left: 0rem;
  height: 4rem;
  font-size: 14px;
  background-color: #ffffff;
  line-height: 4rem;
  text-align: center;
  text-transform: uppercase;
  color: #383838;
  border: 0;
  margin-top: 5rem;
  @media (min-width: 768px) {
    margin-top: 2rem;
    width: 30rem;
  }
  @media (min-width: 1024px) {
    margin-top: 0;
    margin-left: 2rem;
    width: 18rem;
  }
  &:hover {
    background-color: #f6f6f6;
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

const copyFallBack = () => {
  const copyTextArea = document.createElement('textArea');
  copyTextArea.value = 'npm install urql';

  document.body.appendChild(copyTextArea);

  copyTextArea.focus();
  copyTextArea.select();
  document.execCommand('copy');
  copyTextArea.remove();
};

class Hero extends React.Component {
  constructor() {
    super(...arguments);

    this.state = {
      animating: false,
      copied: false,
    };
  }

  handleCopy(e) {
    if (!navigator.clipboard) {
      copyFallBack();
      e.preventDefault();
      return;
    }
    navigator.clipboard.writeText('npm install urql');
  }

  render() {
    return (
      <WrapperStyled noPadding>
        <HeroContent>
          <HeroLogoContainer>
            <HeroLogo src={badge} />
          </HeroLogoContainer>
          <HeroTitle>urql</HeroTitle>
          <HeroBody>
            Universal React Query Library is a blazing-fast GraphQL client,
            exposed as a set of ReactJS components.
          </HeroBody>
          <HeroButtonsWrapper>
            <HeroNPMWrapper>
              <HeroNPMCopy>npm install urql</HeroNPMCopy>
              <HeroNPMButton onClick={this.handleCopy}>copy</HeroNPMButton>
            </HeroNPMWrapper>
            <HeroDocsButton to="/docs">Documentation</HeroDocsButton>
          </HeroButtonsWrapper>
        </HeroContent>
        <HeroNavList>
          <li>
            <Link to="/docs">Docs</Link>
          </li>
          <li>
            <a
              title="Issues"
              href="https://www.github.com/FormidableLabs/urql/issues"
            >
              Issues
            </a>
          </li>
          <li>
            <a title="GitHub" href="https://github.com/FormidableLabs/urql">
              GitHub
            </a>
          </li>
        </HeroNavList>
      </WrapperStyled>
    );
  }
}

export default Hero;
