import React, { Fragment } from "react";
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
  top: -4rem;
  left: -3rem;
  max-width: auto;
  min-width: 29rem;
`;

const ResponsiveHeroLogo = styled.img`
  position: relative;
  top: -23rem;
  left: -2rem;
  min-width: 9rem;
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
`;

class Sidebar extends React.Component {
  constructor(props) {
    super(props);
    this.handleMenuOpen = this.handleMenuOpen.bind(this);
    this.updateWidth = this.updateWidth.bind(this);
    this.state = { openSidebar: false, windowWidth: window.outerWidth };
  }

  componentDidMount() {
    window.addEventListener("resize", this.updateWidth);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateWidth);
  }

  updateWidth() {
    this.setState({ windowWidth: window.outerWidth });
  }

  handleMenuOpen() {
    this.setState({ openSidebar: true });
  }

  renderResponsiveSidebar() {
    return (
      <SidebarContainer small>
        <div onClick={this.handleMenuOpen}>
          <ResponsiveHeroLogo
            src="../../static/svgs/docs_image_small.svg"
            alt="Formidable Logo"
          />
        </div>
      </SidebarContainer>
    );
  }

  renderSidebarMenu() {
    const { sidebarHeaders } = this.props;
    return (
      <SidebarContainer>
        {(this.state.openSidebar || window.outerWidth > 768) && (
          <Fragment>
            <Link to={"/"}>
              <HeroLogo
                src="../../static/svgs/docs_image.svg"
                alt="Formidable Logo"
              />
            </Link>
            <ContentWrapper>
              {sidebarHeaders &&
                sidebarHeaders.map(sh => this.renderSidebarItem(sh))}
            </ContentWrapper>
          </Fragment>
        )}
      </SidebarContainer>
    );
  }

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
                onClick={() =>
                  this.setState({ openSidebar: !this.state.openSidebar })
                }
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
    return (
      <Fragment>
        {(this.state.openSidebar || this.state.windowWidth >= 922) &&
          this.renderSidebarMenu()}
        {this.state.windowWidth <= 921 &&
          !this.state.openSidebar &&
          this.renderResponsiveSidebar()}
      </Fragment>
    );
  }
}

Sidebar.propTypes = {
  sidebarHeaders: PropTypes.array,
  tocArray: PropTypes.array
};

export default withRouter(withRouteData(Sidebar));
