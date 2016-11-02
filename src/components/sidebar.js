import React from "react";
import { Link } from "react-router";
import MarkdownIt from "markdown-it";
import { times } from "lodash";

class Sidebar extends React.Component {
  renderTransformedToc(siblings, targetLocation) {
    const md = MarkdownIt();

    return (
      <ul className="Sidebar-toc">
        {
          siblings.map((sibling, id) => {
            if (Array.isArray(sibling)) {
              return (
                <li className="Sidebar-toc-item" key={id}>
                  {this.renderTransformedToc(sibling, targetLocation)}
                </li>
              );
            }

            return sibling && (
              <li key={id} className="Sidebar-toc-item">
                <Link
                  to={`${targetLocation}#${sibling.anchor}`}
                  dangerouslySetInnerHTML={{__html: md.renderInline(sibling.content)}}
                />
              </li>
            );
          })
        }
      </ul>
    );
  }

  pushToLevel(siblings, level, heading) {
    siblings = siblings.slice(0);
    let parentTarget = siblings;
    let target;

    times(level, () => {
      target = parentTarget[parentTarget.length - 1];

      if (Array.isArray(target)) {
        parentTarget = target;
      } else {
        parentTarget.push([]);
        parentTarget = parentTarget[parentTarget.length - 1];
      }
    });

    if (Array.isArray(target)) {
      target.push(heading);
    } else {
      parentTarget.push(heading);
    }

    return siblings;
  }

  transformTocArray(headings) {
    const topHeading = headings[0];

    return headings.reduce((siblings, heading) => {
      const level = heading.level - topHeading.level;
      return this.pushToLevel(siblings, level, heading);
    }, []);
  }

  renderToc(targetLocation) {
    if (!this.props.location || (this.props.location.pathname !== targetLocation)) {
      return null;
    }

    const list = this.props.tocArray.filter((heading) => heading.level !== 1);

    return this.renderTransformedToc(
      this.transformTocArray(list),
      targetLocation
    );
  }

  renderSidebarItem(href, name, isDocs) {
    const defaultClass = "btn btn--dark u-displayBlock u-nowrap";
    const currentPath = this.props.location && this.props.location.pathname;
    const docsClass = currentPath === "/docs/" ? `${defaultClass} is-active` : defaultClass;

    return (
      <div className="Sidebar-item Grid-cell u-noMarginTop">
        <Link
          to={href}
          className={isDocs ? docsClass : defaultClass}
          activeClassName="is-active"
        >
          {name}
        </Link>
        {this.renderToc(href)}
        {isDocs ? this.renderToc("/docs/") : ""}
      </div>
    );
  }

  render() {
    return (
      <nav className="Sidebar">
        <p className="Subheading u-noMargin">
          Documentation
        </p>
        <div className="
          u-noMarginTop
          Grid
          Grid--gutters
          Grid--full
          medium-Grid--flex--1of3
          large-Grid--column"
        >
          {this.renderSidebarItem("/docs/getting-started/", "Get Started", true)}
          {this.renderSidebarItem("/docs/basic-concepts/", "Basic Concepts")}
          {this.renderSidebarItem("/docs/tag-api/", "Tag API")}
          {this.renderSidebarItem("/docs/props/", "Props")}
          {this.renderSidebarItem("/docs/extensions/", "Extensions")}
        </div>
      </nav>
    );
  }
}

Sidebar.propTypes = {
  location: React.PropTypes.object,
  tocArray: React.PropTypes.array
};

export default Sidebar;
