import React from "react";
import { Button } from "../../components/button";
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Link } from "react-static";
import { Wrapper } from "../../components/wrapper";
import styled from "styled-components";

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
  font-size: 3rem;
  letter-spacing: 0.15em;
  margin: 0 0 2rem;
  text-align: center;
  text-transform: uppercase;
  width: 100%;
  @media (min-width: 768px) {
    font-size: 5.8rem;
    margin: 4rem 0 2rem;
    text-align: left;
  }
`;

const HeroBody = styled.p`
  font-size: 1.4rem;
  line-height: 2.2rem;
  margin: 0 0 6rem;
  max-width: 30rem;
  text-align: left;
  width: 100%;
  @media (min-width: 768px) {
    font-size: 2rem;
    line-height: 2.8rem;
    max-width: 100%;
  }
`;

const HeroLogo = styled.img`
  max-width: 16rem;
  position: relative;
  @media (min-width: 768px) {
    left: -3rem;
    max-width: auto;
    min-width: 32rem;
    position: absolute;
    top: 0;
  }
`;

const HeroCopyLink = styled.p`
  background: #D5D5D5;
  color: #3b3b3b;
  display: flex;
  flex-direction: row;
  line-height: 4rem;
  min-width: 28rem;
  white-space: nowrap;
  @media (min-width: 1024px) {
    margin-right: 2rem;
  }
  & + a {
    min-width: 30rem;
    @media (min-width: 1024px) {
      min-width: 10rem;
    }
  }
`;

const HeroCopyText = styled.span`
  padding: 0 1.6rem;
  text-align: left;
  min-width: 20rem;
`;

const HeroNavList = styled.ul`
  border-top: 0.2rem solid #707070;
  display: flex;
  flex-direction: row;
  justify-content: center;
  list-style: none;
  margin: 4rem 0 0;
  padding: 2rem 0 0;
  text-align: center;
  width: 100%;
  @media (min-width: 768px) {
    margin: 10rem 0 0;
  }
  & li a {
    color: white;
    display: inline-block;
    font-size: 1.4rem;
    letter-spacing: 0.05em;
    margin: 0 1rem;
    transition: opacity 0.4s;
    text-transform: uppercase;
  }
  & li a:hover {
    opacity: 0.7;
  }
`;


class Hero extends React.Component {
  state = {
    copied: false
  }

  handleCopy = e => {
    e.preventDefault();
    this.setState({ copied: true });
    setTimeout(() => { this.setState({ copied: false }) }, 3000);
  }

  render() {
    return(
      <Wrapper noPadding>
        <HeroContent>
          <HeroLogo src="./static/svgs/logo_spectacle_raised.svg" alt="Formidable Logo" />
          <HeroTitle>Spectacle</HeroTitle>
          <HeroBody>A React.js based library for creating sleek presentations using JSX syntax that gives you the ability to live demo your code.</HeroBody>
            <CopyToClipboard text="npm install spectacle">
              <HeroCopyLink onClick={e => this.handleCopy(e)}>
                <HeroCopyText>npm install spectacle</HeroCopyText>
                <Button light noMargin href="#">
                  {
                    (this.state.copied)
                      ? "Copied"
                      : "Copy"
                  }
                </Button>
              </HeroCopyLink>
            </CopyToClipboard>
          <Button light noMargin href="#">Documentation</Button>
        </HeroContent>
        <HeroNavList>
          <li><Link to="/about/">About</Link></li>
          <li><Link to="/docs/">Docs</Link></li>
          <li><a title="Issues" href="https://www.github.com/FormidableLabs/spectacle/issues">Issues</a></li>
          <li><a title="GitHub" href="https://github.com/FormidableLabs/spectacle">GitHub</a></li>
        </HeroNavList>
      </Wrapper>
    );
  }
}

export default Hero;
