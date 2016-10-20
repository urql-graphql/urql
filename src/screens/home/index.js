import React from "react";
import { Link } from "react-router";

// Child components
import TitleMeta from "../../components/title-meta";
import Sidebar from "../../components/sidebar";

class Home extends React.Component {
  render() {
    return (
      <TitleMeta title="Spectacle">
        <div className="Hero">
          <video className="Hero-video" width="100%" autoPlay loop poster="./static/bg-still.png">
            <source src="./static/bg-demo.webm" type="video/webm" />
            <source src="./static/bg-demo.mp4" type="video/mp4" />
          </video>

            <h2 className="Hero-Heading u-noMargin">
              A <strong>React.js based</strong> library for creating <strong>
                <span className="Hero-Subheading">sleek presentations</span>
              </strong>
            </h2>
          </div>

        <div className="Container">

        <div className="Grid Grid--gutters">
          <p className="Grid-cell Grid-cell--autoSize">
            <Link className="btn btn--dark u-nowrap" to="/docs/">
              Get Started with Spectacle
            </Link>
          </p>
          <p className="Grid-cell">
            <a className="btn btn--pink u-nowrap" href="http://stack.formidable.com/spectacle">
              View Live Demo
            </a>
          </p>
        </div>

          <div className="u-noMarginTop Grid Grid--guttersLg Grid--top">
            <div className="Grid-cell Grid-cell--full large-Grid-cell--autoSize">
              <Sidebar />
            </div>
            <div className="Grid-cell Copy--large">
              <h2 className="Subheading u-noMargin">
                Features
              </h2>
              <h3 className="Heading u-marginTopSm">
                Interactive Presentations
              </h3>
              <p>
                Add clickable elements and other interactivity to make your presentations pop.
              </p>
              <h3 className="Heading">
                Live-Preview Your Code
              </h3>
              <p>
                Show people more than just a code block - demo the final project in real-time without leaving your presentation deck.
              </p>
              <h3 className="Heading">
                Auto-Size Text, Image Dimming, and More
              </h3>
              <p>
                On top of all of Spectacle's helpful features, you can also make your presentation look amazing with auto-formatting, easy theming abilities, image dimming, and lots of other fun touches.
              </p>
            </div>
          </div>
        </div>

      </TitleMeta>
    );
  }
}

export default Home;
