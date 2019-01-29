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
  position: relative;
  top: -23rem;
  left: -2rem;
  min-width: 9rem;

  @media (min-width: 1024px) {
    max-width: 14.5rem;
    position: absolute;
    top: -4rem;
    left: -3rem;
    max-width: auto;
    min-width: 29rem;
  }
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
  justify-content: space-between;
  height: 25rem;

  @media (max-width: 1024px) {
    display: none;
  }
`;

const SubContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

class Sidebar extends React.Component {
  renderSidebarItem(item) {
    const { tocArray } = this.props;
    const currentPath = `/docs${item.path}` === window.location.pathname;
    const subContent = tocArray.filter(toc => toc.level === 2);

    return (
      <div key={item.path}>
        <SidebarNavItem
          to={`/docs${item.path}`}
          replace
          key={item.title.split(" ").join("_")}
        >
          {item.title}
        </SidebarNavItem>
        {currentPath && subContent && (
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
      </div>
    );
  }

  render() {
    const { sidebarHeaders } = this.props;

    return (
      <SidebarContainer>
        <Link to={"/"}>
          <HeroLogo
            src="../../static/svgs/docs_image_small.svg"
            srcSet="../../static/svgs/docs_image.svg 1024w"
            alt="Formidable Logo"
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
  sidebarHeaders: PropTypes.array,
  tocArray: PropTypes.array
};

export default withRouter(withRouteData(Sidebar));
