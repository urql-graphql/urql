import React, { Fragment, useMemo } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import * as path from 'path';

import {
  SidebarNavItem,
  SidebarNavSubItem,
  SidebarContainer,
  SidebarWrapper,
  SideBarSvg,
} from './navigation';

import { useMarkdownTree, useMarkdownPage } from '../../plugins/source-markdown';

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

const relative = (from, to) => {
  if (!from || !to) return null;
  const pathname = path.relative(path.dirname(from), to);
  return { pathname };
};

const Sidebar = ({ overlay, closeSidebar }) => {
  const currentPage = useMarkdownPage();
  const tree = useMarkdownTree();
  if (!currentPage || !tree || !tree.children) return;

  const sidebarItems = useMemo(() => {
    return tree.children.map(page => {
      return (
        <Fragment key={page.key}>
          <SidebarNavItem to={relative(currentPage.path, page.path)}>
            {page.frontmatter.title}
          </SidebarNavItem>

          {page.children && page.children.map(childPage => (
            <SidebarNavSubItem
              to={relative(currentPage.path, childPage.path)}
              key={childPage.key}
            >
              {childPage.frontmatter.title}
            </SidebarNavSubItem>
          ))}
        </Fragment>
      );
    });
  }, [tree, currentPage]);

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
          <HeroLogo src={logoSidebar} alt="Formidable Logo" overlay={overlay} />
        </Link>
        <ContentWrapper overlay={overlay}>
          {sidebarItems}
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
};

Sidebar.propTypes = {
  closeSidebar: PropTypes.func,
  overlay: PropTypes.bool,
};

export default Sidebar;
