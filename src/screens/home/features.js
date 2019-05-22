import React from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import { BodyCopy } from "../../components/body-copy";
import { SecondaryTitle } from "../../components/secondary-title";
import { SectionTitle } from "../../components/section-title";

const FullWidthContainer = styled.div`
  display: flex;
  justify-content: center;
  background-color: #0d1129;
`;

const FeaturesWrapper = styled.div`
  flex-direction: column;
  align-items: center;
  display: flex;
  background-color: #0d1129;
  color: #a3abd4;
  padding: 8rem 8rem;
  width: 100%;
  @media (min-width: 768px) {
    flex-direction: column;
    margin: 0 8rem;
  }
`;

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
  margin: 0 0 4rem;
  width: 100%;
  max-width: 28rem;
  text-align: center;
  > img {
    width: 100%;
    max-width: 28rem;
    box-shadow: -20px 20px 0 0 rgba(0, 0, 0, 0.5);
    margin-bottom: 20px;
  }
  @media (min-width: 768px) {
    margin: 0 0 6rem;
    width: calc(1 / 3 * 100% - (1 - 1 / 3) * 40px);
    align-items: flex-start;
    text-align: left;
  }
  @media (min-width: 1024px) {
    width: calc(1 / 3 * 100% - (1 - 1 / 3) * 80px);
  }
`;

const ComponentWrapper = styled.div`
  margin: 0 0 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 28rem;
  text-align: center;
  > img {
    width: 100%;
    max-width: 10rem;
    margin-bottom: 20px;
  }
  @media (min-width: 768px) {
    max-width: 116rem;
    padding: 6rem 8rem 0 8rem;
  }
`;

const BodyCopyCentred = styled(BodyCopy)`
  max-width: 28rem;

  @media (min-width: 768px) {
    text-align: center;
  }

  @media (min-width: 1024px) {
    max-width: 20vw;
  }
`;

const SecondaryTitleCentred = styled(SecondaryTitle)`
  @media (min-width: 768px) {
    text-align: center;
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
      <FullWidthContainer>
        <FeaturesWrapper>
          <SectionTitleStyled>Features</SectionTitleStyled>
          <FeatureWrapper>
            {this.props.featureArray.map(feature => (
              <FeatureCard key={feature.title}>
                <img src={feature.icon} />
                <SecondaryTitleStyled pop>{feature.title}</SecondaryTitleStyled>
                <BodyCopy>{feature.description}</BodyCopy>
              </FeatureCard>
            ))}
          </FeatureWrapper>
          <ComponentWrapper>
            <img src={this.props.components.icon} />
            <SecondaryTitleCentred pop>
              {this.props.components.title}
            </SecondaryTitleCentred>
            <BodyCopyCentred>
              {this.props.components.description}
            </BodyCopyCentred>
          </ComponentWrapper>
        </FeaturesWrapper>
      </FullWidthContainer>
    );
  }
}

Features.propTypes = {
  components: PropTypes.object,
  featureArray: PropTypes.array
};

export default Features;
