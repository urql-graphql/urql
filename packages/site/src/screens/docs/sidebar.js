import React, { Fragment } from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import { withRouteData, withRouter, Link } from "react-static";
import {
  SidebarNavItem,
  SidebarNavSubItem,
  SidebarContainer,
  SidebarWrapper,
  SideBarSvg
} from "../../components/navigation";
import closeButton from "../../static/svgs/x.svg";
import logoSidebar from "../../static/sidebar-badge.svg";
import constants from "../../constants";

const HeroLogo = styled.img`
  position: absolute;
  top: 3rem;
  left: 6rem;
  width: 14rem;

  @media (max-width: 768px) {
    display: ${props => (props.overlay ? "" : "none")};
  }
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin: 3rem 0rem 0rem 2.5rem;
  height: auto;
  @media (max-width: 768px) {
    display: ${props => (props.overlay ? "" : "none")};
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
    display: ${props => (props.overlay ? "block" : "none")};
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
  renderSidebarItem(item) {
    const { tocArray } = this.props;
    const currentPath =
      `/docs${item.path}` === this.props.history.location.pathname;
    // eslint-disable-next-line no-magic-numbers
    const subContent = tocArray.filter(toc => toc.level === 2);
    const key = item.title.split(" ").join("_");

    return (
      <Fragment key={`${key}-group`}>
        <SidebarNavItem
          to={`/docs${item.path}`}
          replace
          key={key}
          className={currentPath ? "is-current" : ""}
        >
          {item.title}
        </SidebarNavItem>
        {currentPath && !!subContent.length && (
          <SubContentWrapper key={key}>
            {subContent.map(sh => (
              <SidebarNavSubItem
                to={`#${sh.content
                  .split(" ")
                  .join("-")
                  .toLowerCase()}`}
                key={sh.content.split(" ").join("_")}
              >
                {sh.content}
              </SidebarNavSubItem>
            ))}
          </SubContentWrapper>
        )}
      </Fragment>
    );
  }

  render() {
    const { sidebarHeaders, overlay, closeSidebar } = this.props;
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
          <Link to={"/"}>
            <HeroLogo
              src={logoSidebar}
              alt="Formidable Logo"
              overlay={overlay}
            />
          </Link>
          <ContentWrapper overlay={overlay}>
            <SidebarNavItem to={constants.readme} key={"readme"}>
              Readme
            </SidebarNavItem>
            {sidebarHeaders &&
              sidebarHeaders.map(sh => this.renderSidebarItem(sh))}

            <HorizontalLine />
            <SidebarNavItem to={constants.githubIssues} key={"issues"}>
              Issues
            </SidebarNavItem>
            <SidebarNavItem to={constants.github} key={"github"}>
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
  history: PropTypes.object,
  overlay: PropTypes.bool,
  sidebarHeaders: PropTypes.array,
  tocArray: PropTypes.array
};

export default withRouter(withRouteData(Sidebar));
