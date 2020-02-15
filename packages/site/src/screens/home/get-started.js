import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { BodyCopy } from '../../components/body-copy';
import { SectionTitle } from '../../components/section-title';
import constants from '../../constants';

import octoCat from '../../assets/github.svg';

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
  h2 {
    margin-top: 0;
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
  height: 4rem;
  padding: 0.5rem 1rem;
  width: 18rem;
  align-items: center;
  justify-content: center;

  img {
    width: 1.6rem;
  }
  p {
    margin: 0;
    font-size: 14px;
    margin-left: 2rem;
    text-decoration: none;
    color: black;
    letter-spacing: 1px;
    color: #383838;
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
  &:hover {
    background-color: #f6f6f6;
  }
`;

const GetStartedTitle = styled(SectionTitle)`
  margin: 2rem 0 4rem;
`;

const ButtonsWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-top: 4rem;
  flex-direction: column;
  @media (min-width: 768px) {
    flex-direction: row;
    margin-top: 6rem;
  }
`;

const DocButton = styled(Link)`
  width: 18rem;
  margin-left: 0rem;
  height: 4rem;
  font-size: 14px;
  background-color: #ffffff;
  line-height: 4rem;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #383838;
  border: 0;
  margin-top: 2rem;
  @media (min-width: 768px) {
    margin-left: 2rem;
    width: 18rem;
    margin-top: 0;
  }
  &:hover {
    background-color: #f6f6f6;
  }
`;

class GetStarted extends React.Component {
  render() {
    const { getStartedObj } = this.props;

    return (
      <OuterWrapper>
        <GetStartedWrapper>
          <GetStartedTitle>Get Started</GetStartedTitle>
          <BodyCopy>{getStartedObj.description}</BodyCopy>
          <ButtonsWrapper>
            <GithubButton href="https://github.com/FormidableLabs/urql">
              <img src={octoCat} />
              <p>GitHub</p>
            </GithubButton>
            <DocButton to="/docs">
              Documentation
            </DocButton>
          </ButtonsWrapper>
        </GetStartedWrapper>
      </OuterWrapper>
    );
  }
}

GetStarted.propTypes = {
  getStartedObj: PropTypes.object,
};

export default GetStarted;
