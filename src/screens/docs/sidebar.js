import React from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import { withRouteData, withRouter, Link } from "react-static";
import {
  SidebarNavItem,
  SidebarNavSubItem,
  SidebarContainer,
  SidebarWrapper
} from "../../components/navigation";
import closeButton from "../../static/svgs/x.svg";
import logoSidebar from "../../static/svgs/logo-sidebar.svg";

const HeroLogo = styled.img`
  position: absolute;
  top: 3rem;
  left: 4rem;
  min-width: 14rem;

  @media (max-width: 768px) {
    display: ${props => (props.overlay ? "" : "none")};
  }
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
  margin-top: 4rem;
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

const Wrapper = styled.div`
  display: inline-block;
  margin-left: 2rem;
`;

const CloseButton = styled.img`
  cursor: pointer;
  top: 1rem;
  right: 7rem;
  position: absolute;
  display: none;

  @media (max-width: 768px) {
    display: ${props => (props.overlay ? "block" : "none")};
  }
`;

class Sidebar extends React.Component {
  renderSidebarItem(item) {
    const { tocArray } = this.props;
    const currentPath =
      `/docs${item.path}` === this.props.history.location.pathname;
    // eslint-disable-next-line no-magic-numbers
    const subContent = tocArray.filter(toc => toc.level === 2);

    return (
      <Wrapper key={item.path}>
        <SidebarNavItem
          to={`/docs${item.path}`}
          replace
          key={item.title.split(" ").join("_")}
        >
          {item.title}
        </SidebarNavItem>
        {currentPath && !!subContent.length && (
          <SubContentWrapper>
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
      </Wrapper>
    );
  }

  render() {
    const { sidebarHeaders, overlay, closeSidebar } = this.props;
    return (
      <SidebarContainer>
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
            <SidebarNavItem to={`/#`} key={"home"}>
              Home
            </SidebarNavItem>
            <SidebarNavItem to={`/docs/getting-started`} key={"documentation"}>
              Documentation
            </SidebarNavItem>
            {sidebarHeaders &&
              sidebarHeaders.map(sh => this.renderSidebarItem(sh))}
            <SidebarNavItem
              to={"https://www.github.com/FormidableLabs/spectacle/issues"}
              key={"issues"}
            >
              Issues
            </SidebarNavItem>
            <SidebarNavItem
              to={"https://github.com/FormidableLabs/spectacle"}
              key={"github"}
            >
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
