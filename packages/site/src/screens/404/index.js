import React, { forwardRef } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { withRouteData } from 'react-static';
import { Link } from 'react-router-dom';

import NotFoundPage from './404';
import Sidebar from '../../components/sidebar';
import constants from '../../constants';

import burger from '../../assets/burger.svg';
import logoFormidableDark from '../../assets/logo_formidable_dark.svg';

const Container = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
`;

const Wrapper = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  height: 6rem;
  width: 100%;
  position: fixed;
  left: 19rem;
  background: white;
  z-index: 1;
  padding-right: 3rem;
  box-shadow: 0 5px 10px -5px lightgrey;

  @media (max-width: 768px) {
    box-shadow: 0 5px 10px -5px lightgrey;
    margin-left: 2.5rem;
    right: 0;
    width: calc(100% - 2rem);
    justify-content: flex-start;
    left: 0;
  }
`;

const HeaderLogo = styled.img`
  position: relative;
  right: 25rem;

  @media (max-width: 768px) {
    right: 7rem;
    padding-left: 2rem;
  }
  @media (max-width: 600px) {
    display: none;
  }
`;

const CollapsedMenu = styled.div`
  cursor: pointer;
  padding-left: 2.5rem;
  display: none;

  @media (max-width: 768px) {
    display: block;
    visibility: ${props => (props.overlay ? 'hidden' : 'visible')};
    padding-left: 2.5rem;
    position: absolute;
    left: 0;
  }
  @media (max-width: 600px) {
    padding-left: 2.5rem;
    position: absolute;
    left: 0;
  }
`;

const DocsTitle = styled.h2`
  font-size: 3rem;
  top: 0.2rem;
  flex: auto;
  width: 100%;
  letter-spacing: 0.5rem;
  margin: 0;
  position: relative;
  left: 10rem;

  @media (max-width: 768px) {
    font-size: 3rem;
    left: 6.5rem;
    margin: 0;
  }
  @media (max-width: 600px) {
    left: 6.5rem;
  }
`;

// eslint-disable-next-line react/display-name
const SideBarWithRef = forwardRef((props, ref) => {
  return (
    <div ref={ref}>
      <Sidebar {...props} />
    </div>
  );
});

/* eslint-disable react/no-multi-comp */
class NotFound extends React.Component {
  constructor(props) {
    super(props);
    this.closeSidebar = this.closeSidebar.bind(this);
    this.state = { openSidebar: false };
    this.sidebarRef = React.createRef();
  }

  openSidebar() {
    this.setState({ openSidebar: true });
  }

  closeSidebar() {
    this.setState({ openSidebar: false });
  }

  render() {
    return (
      <Container
        onClick={event => {
          return !this.sidebarRef.current.contains(event.target) &&
            this.state.openSidebar
            ? this.closeSidebar()
            : null;
        }}
      >
        <Wrapper noPadding>
          <CollapsedMenu overlay={this.state.openSidebar}>
            <img src={burger} alt="Menu" onClick={() => this.openSidebar()} />
          </CollapsedMenu>
          <DocsTitle>
            <Link to={'/'} style={{ color: '#3b3b3b' }}>
              {constants.docsTitle}
            </Link>
          </DocsTitle>
          <Link to={'https://formidable.com'}>
            <HeaderLogo src={logoFormidableDark} alt="Formidable Logo" />
          </Link>
        </Wrapper>
        <SideBarWithRef
          overlay={this.state.openSidebar}
          closeSidebar={this.closeSidebar}
          ref={this.sidebarRef}
        />
        <NotFoundPage />
      </Container>
    );
  }
}

NotFound.propTypes = {
  params: PropTypes.object,
};

NotFound.defaultProps = {
  params: null,
};

export default withRouteData(NotFound);
