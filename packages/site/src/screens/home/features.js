import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { BodyCopy } from '../../components/body-copy';
import { SecondaryTitle } from '../../components/secondary-title';
import { SectionTitle } from '../../components/section-title';
import { PanelSectionWrapper } from '../../components/panel';

const FeatureWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  @media (min-width: 768px) {
    flex-direction: row;
  }
`;
const FeatureCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 28rem;
  text-align: center;
  > img {
    width: 100%;
    max-width: 28rem;
    box-shadow: -20px 20px 0 0 rgba(0, 0, 0, 0.5);
  }
  &:not(:last-child) {
    margin: 0 0 4rem;
  }
  @media (min-width: 768px) {
    margin: 0;
    width: calc(1 / 3 * 100% - (1 - 1 / 3) * 40px);
    align-items: flex-start;
    text-align: left;
  }
  @media (min-width: 1024px) {
    width: calc(1 / 3 * 100% - (1 - 1 / 3) * 80px);
  }
`;

const SectionTitleStyled = styled(SectionTitle)`
  margin-top: 0;
  margin-bottom: 4rem;
  @media (min-width: 768px) {
    margin-top: 0;
    margin-bottom: 6rem;
  }
`;

const SecondaryTitleStyled = styled(SecondaryTitle)`
  @media (min-width: 768px) {
    margin-left: 0;
    margin-right: 0;
  }
`;

class Features extends React.Component {
  render() {
    return (
      <PanelSectionWrapper>
        <SectionTitleStyled>Features</SectionTitleStyled>
        <FeatureWrapper>
          {this.props.featureArray.map(feature => (
            <FeatureCard key={feature.title}>
              <img src={feature.icon} />
              <SecondaryTitleStyled>{feature.title}</SecondaryTitleStyled>
              <BodyCopy>{feature.description}</BodyCopy>
            </FeatureCard>
          ))}
        </FeatureWrapper>
      </PanelSectionWrapper>
    );
  }
}

Features.propTypes = {
  featureArray: PropTypes.array,
};

export default Features;
