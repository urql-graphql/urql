import React from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import { withRouteData, withRouter, Link } from "react-static";
import {
  SidebarNavItem,
  SidebarNavSubItem,
  SidebarContainer
} from "../../components/navigation";

const HeroLogo = styled.img`
  position: absolute;
  top: 2rem;
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
  margin-top: 1rem;
  height: auto;
`;

const SubContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 2rem;
`;

const Wrapper = styled.div`
  display: inline-block;
`;

const CloseButton = styled.img`
  top: 2rem;
  right: 7rem;
  position: absolute;
  display: ${props => (props.overlay ? "" : "none")};
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
      <SidebarContainer overlay={overlay}>
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
        <ContentWrapper>
          {sidebarHeaders &&
            sidebarHeaders.map(sh => this.renderSidebarItem(sh))}
        </ContentWrapper>
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
