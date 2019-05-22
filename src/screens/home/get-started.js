import React from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import { BodyCopy } from "../../components/body-copy";
import { Button } from "../../components/button";
import { SectionTitle } from "../../components/section-title";
import { Wrapper } from "../../components/wrapper";
import constants from "../../constants";
import octoCat from "../../static/svgs/Octicons-mark-github.svg";

const OuterWrapper = styled.div`
  background: ${constants.color};
  border-bottom: 1rem solid rgba(0, 0, 0, 0.4);
  box-shadow: inset 0 -1rem 0 rgba(0, 0, 0, 0.2);
  display: flex;
  justify-content: center;
`;

const GetStartedWrapper = styled.div`
  p {
    text-align: center;
  }
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 8rem;
`;

const GithubButton = styled.a`
  background-color: white;
  display: flex;
  flex-direction: row;
  height: 3rem;
  padding: 0.5rem 1rem;
  border-radius: 3px;
  width: 9rem;
  align-items: center;
  justify-content: center;
  img {
    width: 1.6rem;
  }
  p {
    margin: 0;
    font-size: 14px;
    font-weight: bold;
    margin-left: 0.66rem;
    text-decoration: none;
    color: black;
  }
  &:active {
    p {
      color: black;
    }
  }
  &:visited {
    p {
      color: black;
    }
  }
`;

const GetStartedTitle = styled(SectionTitle)`
  margin: 2rem 0 4rem;
`;

class GetStarted extends React.Component {
  render() {
    const { getStartedObj } = this.props;

    return (
      <OuterWrapper>
        <GetStartedWrapper>
          <GetStartedTitle>Get Started</GetStartedTitle>
          <BodyCopy>{getStartedObj.description}</BodyCopy>
          <Button to={getStartedObj.link}>Documentation</Button>
          <GithubButton href="https://github.com/FormidableLabs/urql">
            <img src={octoCat} />
            <p>GitHub</p>
          </GithubButton>
        </GetStartedWrapper>
      </OuterWrapper>
    );
  }
}

GetStarted.propTypes = {
  getStartedObj: PropTypes.object
};

export default GetStarted;
