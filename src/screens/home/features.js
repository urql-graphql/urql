import React from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import { SectionTitle } from "../../components/section-title";
import { Wrapper } from "../../components/wrapper";

const FeatureCard = styled.div`
  margin: 0 0 4rem;
  width: 100%;
  @media (min-width: 768px) {
    margin: 0;
    width: calc(1/3 * 100% - (1 - 1/3) * 80px);
  }
`;

const FeatureSubTitle = styled.h3`
  font-size: 2.2rem;
  line-height: 2.6rem;
  margin: 2rem 0 1rem;
`;

const FeatureBody = styled.p`
  font-size: 1.5rem;
  line-height: 2.4rem;
  margin: 0;
`;

class Features extends React.Component {
  render() {
    return (
      <Wrapper>
        <SectionTitle>Features</SectionTitle>
        {this.props.featureArray.map(feature => {
          return (
            <FeatureCard key={feature.title}>
              <img src={feature.icon} />
              <FeatureSubTitle>{feature.title}</FeatureSubTitle>
              <FeatureBody>{feature.description}</FeatureBody>
            </FeatureCard>
          );
        })}
      </Wrapper>
    );
  }
}

Features.propTypes = {
  featureArray: PropTypes.array
};

export default Features;
