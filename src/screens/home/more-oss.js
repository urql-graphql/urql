import React from "react";
import PropTypes from "prop-types";
import bgImg from "../../static/bg_mountains_gray.jpg";
import styled from "styled-components";
import { BodyCopy } from "../../components/body-copy";
import { Button } from "../../components/button";
import { SecondaryTitle } from "../../components/secondary-title";
import { SectionTitle } from "../../components/section-title";
import { Wrapper } from "../../components/wrapper";

const OuterWrapper = styled.div`
  background: #414141 url(${bgImg}) no-repeat center bottom;
  background-size: cover;
  color: white;
`;

const OSSCard = styled.div`
  margin: 0 auto 4rem;
  max-width: 43rem;
  padding-left: 10rem;
  position: relative;
  text-align: left;
  width: 100%;
  @media (min-width: 768px) {
    width: calc(1 / 2 * 100% - (1 - 1 / 2) * 80px);
  }
  @media (min-width: 1024px) {
    padding-left: 17rem;
  }
`;

const OSSImage = styled.img`
  left: 0;
  position: absolute;
  top: 2rem;
  width: 8rem;
  @media (min-width: 1024px) {
    width: 14rem;
  }
`;

class MoreOSS extends React.Component {
  render() {
    return (
      <OuterWrapper>
        <Wrapper>
          <SectionTitle>More Open Source from Formidable</SectionTitle>
          {this.props.ossArray.map(card => (
            <OSSCard key={card.title}>
              <OSSImage src={card.logo} />
              <SecondaryTitle>{card.title}</SecondaryTitle>
              <BodyCopy>{card.description}</BodyCopy>
            </OSSCard>
          ))}
          <Button light href="#">
            View All
          </Button>
        </Wrapper>
      </OuterWrapper>
    );
  }
}

MoreOSS.propTypes = {
  ossArray: PropTypes.array
};

export default MoreOSS;
