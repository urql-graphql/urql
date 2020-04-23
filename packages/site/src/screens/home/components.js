import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { SecondaryTitle } from '../../components/secondary-title';
import { BodyCopy } from '../../components/body-copy';
import { PanelSectionWrapper } from '../../components/panel';

const ComponentWrapper = styled.div`
  margin: 0 0 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  > img {
    width: 100%;
    max-width: 10rem;
    margin-bottom: 20px;
  }
`;

const SecondaryTitleCentred = styled(SecondaryTitle)`
  @media (min-width: 768px) {
    text-align: center;
  }
`;

const BodyCopyCentred = styled(BodyCopy)`
  margin-top: 2rem;
  max-width: 28rem;

  @media (min-width: 768px) {
    text-align: center;
  }

  @media (min-width: 1024px) {
    max-width: 20vw;
  }
`;

const Components = props => {
  return (
    <PanelSectionWrapper isLight>
      <ComponentWrapper>
        <img src={props.components.icon} />
        <SecondaryTitleCentred>{props.components.title}</SecondaryTitleCentred>
        <BodyCopyCentred>{props.components.description}</BodyCopyCentred>
      </ComponentWrapper>
    </PanelSectionWrapper>
  );
};

Components.displayName = 'Components';

Components.propTypes = {
  components: PropTypes.object,
};

export default Components;
