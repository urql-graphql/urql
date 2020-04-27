import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { BodyCopy } from '../../components/body-copy';
import { Link } from '../../components/link';
import { SectionTitle } from '../../components/section-title';
import { PanelSectionWrapper } from '../../components/panel';

const GetStartedWrapper = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  max-width: 55rem;
  p {
    text-align: center;
  }
  h2 {
    margin-top: 0;
  }
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
  margin-top: 6rem;
  flex-direction: column;
  @media (min-width: 768px) {
    flex-direction: row;
  }
`;

class GetStarted extends React.Component {
  render() {
    const { content } = this.props;

    return (
      <PanelSectionWrapper>
        <GetStartedWrapper>
          <GetStartedTitle>Get Started</GetStartedTitle>
          <BodyCopy noMargin>{content.description}</BodyCopy>
          <ButtonsWrapper>
            <Link to="docs/">Quick Start Guide</Link>
          </ButtonsWrapper>
        </GetStartedWrapper>
      </PanelSectionWrapper>
    );
  }
}

GetStarted.propTypes = {
  content: PropTypes.object,
};

export default GetStarted;
