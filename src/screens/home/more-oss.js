import React from "react";
import PropTypes from "prop-types";
import bgImg from '../../static/bg_mountains_gray.jpg';
import styled from "styled-components";
import { Button } from "../../components/button";
import { SectionTitle } from "../../components/section-title";
import { Wrapper } from "../../components/wrapper";

const OutterWrapper = styled.div`
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
    width: calc(1/2 * 100% - (1 - 1/2) * 80px);
  }
  @media (min-width: 1024px) {
    padding-left: 17rem;
  }
`;

const OSSBody = styled.p`
  font-size: 1.5rem;
  line-height: 2.4rem;
  margin: 0;
  width: 100%;
`;

const OSSTitle = styled.h3`
  font-size: 2.2rem;
  line-height: 2.6rem;
  margin: 2rem 0 1rem;
`;

const OSSImage = styled.img`
  left:0;
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
      <OutterWrapper>
        <Wrapper>
          <SectionTitle>More Open Source from Formidable</SectionTitle>
          {this.props.ossArray.map(card => (
            <OSSCard key={card.title}>
              <OSSImage src={card.logo} />
              <OSSTitle>{card.title}</OSSTitle>
              <OSSBody>{card.description}</OSSBody>
            </OSSCard>
          ))}
          <Button light href="#">View All</Button>
        </Wrapper>
      </OutterWrapper>
    );
  }
}

MoreOSS.propTypes = {
  ossArray: PropTypes.array
};

export default MoreOSS;
