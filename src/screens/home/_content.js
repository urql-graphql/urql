// github.com/FormidableLabs/dogs/blob/master/dogs.json// ----------------------------------------------------------
// Home Page Dynamic content: replace these values for re-use
// ----------------------------------------------------------
import bucketClick from "../../static/svgs/bucket_click.svg";
import bucketCode from "../../static/svgs/bucket_code.svg";
import bucketAmazing from "../../static/svgs/bucket_amazing.svg";
import logoVictory from "../../static/svgs/logo_victory.svg";
import logoDevelopmentDashboards from "../../static/svgs/logo_development-dashboards.svg";

const content = {
  features: [
    {
      title: "Interactive Presentations",
      description:
        "Add clickable elements and other interactivity to make your presentations pop.",
      icon: require("../../static/svgs/bucket_click.svg")
    },
    {
      title: "Live-Preview Your Code",
      description:
        "Show people more than just a code block - demo the final project in real-time without leaving your presentation deck.",
      icon: require("../../static/svgs/bucket_code.svg")
    },
    {
      title: "Auto-Size Text, Image Dimming, and More",
      description:
        "On top of all of Spectacle's helpful features, you can also make your presentation look amazing with auto-formatting, easy themeing abilities, image dimming, and lots of other fun touches",
      icon: require("../../static/svgs/bucket_amazing.svg")
    }
  ],
  getStarted: {
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    link: "/docs"
  },
  preview: {
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    media: ""
  },
  oss: [
    {
      title: "Victory",
      description:
        "An ecosystem of modular data visualization components for React. Friendly and flexible.",
      logo: require("../../static/svgs/logo_victory.svg"),
      link: "https://formidable.com/open-source/victory"
    },
    {
      title: "Development Dashboards",
      description:
        "Dashboards to organize and intuitively display your dev server and tooling output.",
      logo: require("../../static/svgs/logo_development-dashboards.svg"),
      link: "https://formidable.com/open-source/development-dashboards/"
    },
    {
      title: "React Animations",
      description:
        "A collection of animations that can be used with many inline style libraries, such as Radium or Aphrodite.",
      logo: require("../../static/svgs/logo_react-animation.svg"),
      link: "https://formidable.com/open-source/react-animations"
    },
    {
      title: "Enzyme Matchers",
      description:
        "Run common assertions on your React components using Enzyme in a Jest or Jasmine environment.",
      logo: require("../../static/svgs/logo_enzyme-matchers.svg"),
      link: "https://formidable.com/open-source/jest-enzyme/"
    }
  ]
};

export default content;
