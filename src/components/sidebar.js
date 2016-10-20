import React from "react";
import { Link } from "react-router";
import basename from "../basename";
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
                  to={`${basename}${targetLocation}#${sibling.anchor}`}
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

  render() {
    const currentPath = this.props.location && this.props.location.pathname;
    const gettingStartedClass = currentPath === "/docs/" ? "btn btn--dark u-displayBlock u-nowrap is-active" : "btn btn--dark u-displayBlock u-nowrap";

    return (
      <nav className="Sidebar">
        <p className="Subheading u-noMargin">
          Documentation
        </p>
        <div className="u-noMarginTop Grid Grid--gutters Grid--1of3--flex large-Grid--column">
          <div className="Grid-cell u-noMarginTop">
            <Link to="/docs/getting-started/"
              className={gettingStartedClass} activeClassName="is-active"
            >
              Get Started
            </Link>
            {this.renderToc("/docs/getting-started/")}
            {this.renderToc("/docs/")}
          </div>
          <div className="Grid-cell u-noMarginTop">
            <Link to="/docs/basic-concepts/"
              className="btn btn--dark u-displayBlock u-nowrap" activeClassName="is-active"
            >
              Basic Concepts
            </Link>
            {this.renderToc("/docs/basic-concepts/")}
          </div>
          <div className="Grid-cell u-noMarginTop">
            <Link to="/docs/tag-api/"
              className="btn btn--dark u-displayBlock u-nowrap" activeClassName="is-active"
            >
              Tag API
            </Link>
            {this.renderToc("/docs/tag-api/")}
          </div>
          <div className="Grid-cell u-noMarginTop">
            <Link to="/docs/props/"
              className="btn btn--dark u-displayBlock u-nowrap" activeClassName="is-active"
            >
              Props
            </Link>
            {this.renderToc("/docs/props/")}
          </div>
          <div className="Grid-cell u-noMarginTop">
            <Link to="/docs/extensions/"
              className="btn btn--dark u-displayBlock u-nowrap" activeClassName="is-active"
            >
              Extensions
            </Link>
            {this.renderToc("/docs/extensions/")}
          </div>
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
