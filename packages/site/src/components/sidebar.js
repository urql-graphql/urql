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

import { useMarkdownTree } from '../../plugins/source-markdown/hooks';

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

// override the heading slug with the page path
const getTocArray = pages =>
  pages.map(p => p.headings.map(heading => ({ ...heading, slug: p.path })));

const renderSidebarItem = (item, isCurrentPath) => {
  // const headings = item.pages.find(page => page.depth === 1);
  // const subContent = tocArray.filter(toc => toc.depth === 2);

  console.log(item);
  const className = isCurrentPath ? 'is-current' : '';
  return (
    <Fragment key={`${item.value}-group`}>
      <SidebarNavItem
        /* path relative to current */
        replace
        key={`${item.section}-${className}`}
        className={className}
      >
        {item.section}
      </SidebarNavItem>
      {item.pages.map(p => (
        <SidebarNavSubItem key={p.frontmatter.title}>
          {p.frontmatter.title}
        </SidebarNavSubItem>
      ))}

      {isCurrentPath && !!subContent.length && (
        <SubContentWrapper key={heading.slug}>
          {subContent.map((sh, i) => (
            <SidebarNavSubItem
              to={`#${sh.slug}`}
              key={[...heading.slug, ...sh.slug].join('_')}
            >
              {sh.value}
            </SidebarNavSubItem>
          ))}
        </SubContentWrapper>
      )}
    </Fragment>
  );
};

/*
      <SidebarNavItem
        to={heading.slug}
        replace
        key={`${heading.slug}-${className}`}
        className={className}
      >
        {heading.value}
      </SidebarNavItem>

*/

const Sidebar = ({
  sidebarHeaders,
  overlay,
  closeSidebar,
  tocArray,
  location,
}) => {
  const tree = useMarkdownTree();

  console.log(tree);

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
          {tree &&
            tree.map(t =>
              renderSidebarItem(t, t.section === location.pathname)
            )}

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
  location: PropTypes.object,
  overlay: PropTypes.bool,
  sidebarHeaders: PropTypes.array,
  tocArray: PropTypes.array,
};

export default Sidebar;
