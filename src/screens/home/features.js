import React from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import { BodyCopy } from "../../components/body-copy";
import { SecondaryTitle } from "../../components/secondary-title";
import { SectionTitle } from "../../components/section-title";
import { Wrapper } from "../../components/wrapper";

const FullWidthContainer = styled.div`
  display: flex;
  justify-content: center;
  background-color: #0d1129;
`;

const FeaturesWrapper = styled(Wrapper)`
  flex-direction: column;
  align-items: center;
  display: flex;
  background-color: #0d1129;
  color: #a3abd4;
  width: 100%;
  @media (min-width: 768px) {
    flex-direction: column;
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
  margin: 0 0 8rem;
  width: 100%;
  > img {
    width: 100%;
    max-width: 28rem;
    box-shadow: -20px 20px 0 0 rgba(0, 0, 0, 0.5);
    margin-bottom: 20px;
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

const ComponentWrapper = styled.div`
  margin: 0 0 8rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  > img {
    width: 100%;
    max-width: 10rem;
  }
  @media (min-width: 768px) {
    padding-top: 10rem;
    margin: 0 0 4rem;
  }
`;

const BodyCopyCentred = styled(BodyCopy)`
  @media (min-width: 768px) {
    text-align: center;
  }
`;

const SecondaryTitleCentred = styled(SecondaryTitle)`
  @media (min-width: 768px) {
    text-align: center;
  }
`;
class Features extends React.Component {
  render() {
    return (
      <FullWidthContainer>
        <FeaturesWrapper>
          <SectionTitle>Features</SectionTitle>
          <FeatureWrapper>
            {this.props.featureArray.map(feature => (
              <FeatureCard key={feature.title}>
                <img src={feature.icon} />
                <SecondaryTitle>{feature.title}</SecondaryTitle>
                <BodyCopy>{feature.description}</BodyCopy>
              </FeatureCard>
            ))}
          </FeatureWrapper>
          <ComponentWrapper>
            <img src={this.props.components.icon} />
            <SecondaryTitleCentred>
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
