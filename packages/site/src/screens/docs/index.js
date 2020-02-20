import React, { forwardRef, useState, useRef } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { withRouteData } from 'react-static';
import { Link } from 'react-router-dom';

import Article from './article';
import Header from './header';
import Sidebar from '../../components/sidebar';

import burger from '../../assets/burger.svg';
import logoFormidableDark from '../../assets/logo_formidable_dark.svg';

const Container = styled.div`
  display: flex;
  flex-direction: row;

  width: 100%;
  max-width: ${p => p.theme.layout.page};
  margin: 0 auto;

  background: ${p => p.theme.colors.bg};
  border-left: 1px solid ${p => p.theme.colors.border};
  border-right: 1px solid ${p => p.theme.colors.border};

  margin-top: ${p => p.theme.layout.header};
`;

const Docs = props => {
  return (
    <>
      <Header />
      <Container>
        <Sidebar />
        <Article>
          {props.children}
        </Article>
      </Container>
    </>
  );
};

Docs.propTypes = {
  location: PropTypes.object,
  params: PropTypes.object,
  sidebarHeaders: PropTypes.array,
  slug: PropTypes.string,
  toc: PropTypes.object,
};

Docs.defaultProps = {
  params: null,
};

export default withRouteData(Docs);
