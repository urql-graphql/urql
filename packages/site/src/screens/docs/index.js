import React, { useState } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { withRouteData } from 'react-static';

import Article from './article';
import Header from './header';
import Sidebar from '../../components/sidebar';

import burger from '../../assets/burger.svg';
import closeButton from '../../assets/close.svg';

const Container = styled.div`
  display: flex;
  flex-direction: row;

  width: 100%;
  max-width: ${p => p.theme.layout.page};
  margin: 0 auto;
  margin-top: ${p => p.theme.layout.header};
`;

const OpenCloseSidebar = styled.img.attrs(props => ({
  src: props.sidebarOpen ? closeButton : burger,
}))`
  cursor: pointer;
  display: block;
  margin: ${p => p.theme.spacing.sm} ${p => p.theme.spacing.md};
  position: absolute;
  right: 0;
  top: 0;
  z-index: 1;
  @media ${p => p.theme.media.sm} {
    display: none;
  }
`;

const Docs = props => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Header />
      <Container>
        <OpenCloseSidebar
          sidebarOpen={sidebarOpen}
          onClick={() => setSidebarOpen(prev => !prev)}
        />
        <Sidebar sidebarOpen={sidebarOpen} />
        <Article sidebarOpen={sidebarOpen}>{props.children}</Article>
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
