import React from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import { BodyCopy } from "../../components/body-copy";
import { SecondaryTitle } from "../../components/secondary-title";
import { SectionTitle } from "../../components/section-title";
import { Wrapper } from "../../components/wrapper";

const FeatureCard = styled.div`
  margin: 0 0 4rem;
  width: 100%;
  @media (min-width: 768px) {
    margin: 0;
    width: calc(1 / 3 * 100% - (1 - 1 / 3) * 40px);
  }
  @media (min-width: 1024px) {
    width: calc(1 / 3 * 100% - (1 - 1 / 3) * 80px);
  }
`;

class Features extends React.Component {
  render() {
    return (
      <Wrapper>
        <SectionTitle>Features</SectionTitle>
        {this.props.featureArray.map(feature => (
          <FeatureCard key={feature.title}>
            <img src={feature.icon} />
            <SecondaryTitle>{feature.title}</SecondaryTitle>
            <BodyCopy>{feature.description}</BodyCopy>
          </FeatureCard>
        ))}
      </Wrapper>
    );
  }
}

Features.propTypes = {
  featureArray: PropTypes.array
};

export default Features;
