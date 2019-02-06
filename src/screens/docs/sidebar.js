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

const HeroLogo = styled.img`
  position: absolute;
  top: 3rem;
  left: 4rem;
  min-width: 14rem;

  @media (max-width: 768px) {
    display: ${props => (props.overlay ? "" : "none")};
    position: relative;
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
    top: 7rem;
    display: ${props => (props.overlay ? "block" : "none")};
  }
`;

class Sidebar extends React.Component {
  renderSidebarItem(item) {
    const { tocArray } = this.props;
    const currentPath = `/docs${item.path}` === window.location.pathname;
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
            src="../../static/svgs/x.svg"
            alt="X"
            overlay={overlay}
            onClick={() => closeSidebar()}
          />
          <Link to={"/"}>
            <HeroLogo
              src="../../static/svgs/logo-sidebar.svg"
              alt="Formidable Logo"
              overlay={overlay}
            />
          </Link>
          <ContentWrapper overlay={overlay}>
            <SidebarNavItem to={`/#`} replace key={"home"}>
              Home
            </SidebarNavItem>
            <SidebarNavItem
              to={`/docs/getting-started`}
              replace
              key={"documentation"}
            >
              Documentation
            </SidebarNavItem>
            {sidebarHeaders &&
              sidebarHeaders.map(sh => this.renderSidebarItem(sh))}
            <SidebarNavItem
              to={"https://www.github.com/FormidableLabs/spectacle/issues"}
              replace
              key={"issues"}
            >
              Issues
            </SidebarNavItem>
            <SidebarNavItem
              to={"https://github.com/FormidableLabs/spectacle"}
              replace
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
  overlay: PropTypes.bool,
  sidebarHeaders: PropTypes.array,
  tocArray: PropTypes.array
};

export default withRouter(withRouteData(Sidebar));
