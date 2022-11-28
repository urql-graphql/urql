import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { BodyCopy } from '../../components/body-copy';
import { Link } from '../../components/link';
import { PanelSectionWrapper } from '../../components/panel';
import { SectionTitle } from '../../components/section-title';
import { SecondaryTitle } from '../../components/secondary-title';

const OSSCardContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: repeat(4, 1fr);
  grid-gap: 4rem;
  width: calc(100% - 4rem);
  max-width: 75%;
  margin: auto auto 4rem auto;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr);
    max-width: 116rem;
  }
`;

const OSSCard = styled.div`
  text-align: left;
  display: flex;
  flex-direction: column;
  align-items: center;

  > * {
    margin-top: 0;
    margin-bottom: 0;
  }

  > * + * {
    margin-top: 1rem;
  }

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;

    > * {
      margin-left: 0;
      margin-right: 0;
    }

    > * + * {
      margin-top: 0;
      margin-left: 3rem;
    }
  }
`;

const OSSImage = styled.img`
  flex: 0 0 15rem;
  height: 15rem;
`;

const OSSCopyContainer = styled.div`
  display: flex;
  flex-direction: column;

  > * {
    margin-top: 0;
    margin-bottom: 0;
  }

  > * + * {
    margin-top: 2rem;
  }
`;

const OSSTitle = styled(SecondaryTitle)`
  transition: opacity 0.3s ease-out;
  margin: 0;

  &:hover {
    opacity: 0.7;
  }

  @media (min-width: 768px) {
    text-align: left;
  }
`;

const OSSDescription = styled(BodyCopy)`
  @media (min-width: 768px) {
    text-align: left;
  }
`;

const MoreOSS = ({ oss }) => (
  <PanelSectionWrapper background="#000000">
    <SectionTitle>More Open Source from Formidable</SectionTitle>
    <OSSCardContainer>
      {oss.map(card => {
        return (
          <OSSCard key={card.title}>
            <OSSImage src={card.logo} />
            <OSSCopyContainer>
              <a href={card.link} target="_blank" rel="noopener noreferrer">
                <OSSTitle>{card.title}</OSSTitle>
              </a>
              <OSSDescription>{card.description}</OSSDescription>
            </OSSCopyContainer>
          </OSSCard>
        );
      })}
    </OSSCardContainer>
    <Link isExternal to="https://formidable.com/open-source/">
      View All
    </Link>
  </PanelSectionWrapper>
);

MoreOSS.propTypes = {
  oss: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      link: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      logo: PropTypes.string.isRequired,
    }).isRequired
  ).isRequired,
};

export default MoreOSS;
