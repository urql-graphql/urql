import React from "react";
import PropTypes from "prop-types";
import { ProjectBadge } from "formidable-oss-badges";
import bgImg from "../../static/section-3-bg.svg";
import bgImgMobile from "../../static/section-3-bg-mobile.svg";
import styled from "styled-components";
import { BodyCopy } from "../../components/body-copy";
import { Button } from "../../components/button";
import { SecondaryTitle } from "../../components/secondary-title";
import { SectionTitle } from "../../components/section-title";
import { Wrapper } from "../../components/wrapper";

const OuterWrapper = styled.div`
  background-color: #8196ff;
  background-image: url(${bgImgMobile});
  background-repeat: no-repeat;
  background-size: 100%;
  color: white;
  @media (min-width: 768px) {
    background-image: url(${bgImg});
  }
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
  padding: 7px;
  @media (min-width: 1024px) {
    padding: 14px;
    width: 14rem;
  }
`;

const OSSLink = styled.a`
  & h3 {
    color: white;
  }
  & h3:hover {
    opacity: 0.7;
  }
`;

const StyledProjectBadge = styled(ProjectBadge)`
  left: 0;
  position: absolute;
  top: 2rem;
  width: 8rem;
  @media (min-width: 1024px) {
    width: 14rem;
  }
`;

// TODO: should the background of this section be #000000 ? Check designs again
class MoreOSS extends React.Component {
  render() {
    return (
      <OuterWrapper>
        <Wrapper>
          <SectionTitle>More Open Source from Formidable</SectionTitle>
          {this.props.ossArray.map(card => (
            <OSSCard key={card.title}>
              <OSSLink href={card.link}>
                {card.hasOwnLogo ? (
                  <OSSImage src={card.logo} />
                ) : (
                  <StyledProjectBadge
                    color={card.color}
                    number={card.number}
                    abbreviation={card.abbreviation}
                    description={card.title}
                  />
                )}
                <SecondaryTitle>{card.title}</SecondaryTitle>
              </OSSLink>
              <BodyCopy>{card.description}</BodyCopy>
            </OSSCard>
          ))}
          <Button light="true" to="https://formidable.com/open-source/">
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
