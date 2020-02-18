import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

import {
  SidebarNavItem,
  SidebarNavSubItem,
  SidebarContainer,
  SidebarWrapper,
  SideBarSvg,
} from './navigation';

import closeButton from '../assets/close.svg';
import logoSidebar from '../assets/sidebar-badge.svg';
import constants from '../constants';

const HeroLogo = styled.img`
  position: absolute;
  top: 3rem;
  left: 6rem;
  width: 14rem;

  @media (max-width: 768px) {
    display: ${props => (props.overlay ? '' : 'none')};
  }
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin: 3rem 0rem 0rem 2.5rem;
  height: auto;
  @media (max-width: 768px) {
    display: ${props => (props.overlay ? '' : 'none')};
  }
`;

const SubContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 2rem;
`;

const CloseButton = styled.img`
  cursor: pointer;
  top: 1rem;
  right: 7rem;
  position: absolute;
  display: none;

  @media (max-width: 768px) {
    display: ${props => (props.overlay ? 'block' : 'none')};
    right: 1rem;
  }
`;

const HorizontalLine = styled.hr`
  width: 100%;
  height: 2px;
  background-color: #2e2e2e;
  opacity: 0.1;
  border: none;
  margin: 1rem 0;
`;

class Sidebar extends React.Component {
  renderSidebarItem(tocArray) {
    const heading = tocArray.find(toc => toc.level === 1);
    // const currentPath =
    //   `/docs${tocArray.filter(toc => toc.level === 1).path}` ===

    const currentPath = `/${heading.slug}` === this.props.location.pathname;
    // eslint-disable-next-line no-magic-numbers
    const subContent = tocArray.filter(toc => toc.level === 2);
    const key = heading.slug;
    const className = currentPath ? 'is-current' : '';
    return (
      <Fragment key={`${key}-group`}>
        <SidebarNavItem
          to={`/docs${heading.slug}`}
          replace
          key={`${key}-${className}`}
          className={className}
        >
          {heading.title}
        </SidebarNavItem>
        {currentPath && !!subContent.length && (
          <SubContentWrapper key={key}>
            {subContent.map((sh, i) => (
              <SidebarNavSubItem
                to={`#${sh.slug}`}
                key={[...heading.slug, ...sh.slug].join('_')}
              >
                {sh.title}
              </SidebarNavSubItem>
            ))}
          </SubContentWrapper>
        )}
      </Fragment>
    );
  }

  render() {
    const { sidebarHeaders, overlay, closeSidebar, tocArray } = this.props;

    console.log(tocArray);

    return (
      <SidebarContainer>
        <SideBarSvg />
        <SidebarWrapper overlay={overlay}>
          <CloseButton
            src={closeButton}
            alt="X"
            overlay={overlay}
            onClick={() => closeSidebar()}
          />
          <Link to={'/'}>
            <HeroLogo
              src={logoSidebar}
              alt="Formidable Logo"
              overlay={overlay}
            />
          </Link>
          <ContentWrapper overlay={overlay}>
            {this.renderSidebarItem(tocArray)}

            <HorizontalLine />
            <SidebarNavItem as="a" href={constants.githubIssues} key={'issues'}>
              Issues
            </SidebarNavItem>
            <SidebarNavItem as="a" href={constants.github} key={'github'}>
              Github
            </SidebarNavItem>
          </ContentWrapper>
        </SidebarWrapper>
      </SidebarContainer>
    );
  }
}

Sidebar.propTypes = {
  closeSidebar: PropTypes.func,
  location: PropTypes.object,
  overlay: PropTypes.bool,
  sidebarHeaders: PropTypes.array,
  tocArray: PropTypes.array,
};

export default Sidebar;
