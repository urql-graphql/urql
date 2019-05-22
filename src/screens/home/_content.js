const content = {
  features: [
    {
      title: "Fully functional GraphQL client with a single import",
      description:
        "Urql is a lightweight, powerful, and easy to use alternative to bulky GraphQL clients.",
      icon: require("../../static/svgs/gql-tile.svg")
    },
    {
      title: "Logical default behavior and caching",
      description:
        "Urql helps you to rapidly use GraphQL in your apps without complex configuration or large API overhead.",
      icon: require("../../static/svgs/clock-tile.svg")
    },
    {
      title: "Extensible library that grows with you",
      description:
        "Want to change how you fetch, cache, or subscribe to data? Urql Exchanges allow you to customize your data layer to suit your needs.",
      icon: require("../../static/svgs/eagle-tile.svg")
    }
  ],
  components: {
    title: "Minimal React Components and Hooks",
    description:
      "Whether you prefer a <Query> component or useQuery Hook, urql's API is intuitive to use, with full support for GraphQL Queries, Mutations and Subscriptions in both styles!",
    icon: require("../../static/svgs/React-icon.svg")
  },
  preview: {
    description: "",
    media: ""
  },
  getStarted: {
    description:
      "Dive into the documentation to see how you can get your urql client up and running.",
    link: "/docs"
  },
  oss: [
    {
      title: "Victory",
      description:
        "An ecosystem of modular data visualization components for React. Friendly and flexible.",
      logo: require("../../static/svgs/logo_victory.svg"),
      link: "https://formidable.com/open-source/victory",
      hasOwnLogo: true
    },
    {
      title: "Development Dashboards",
      description:
        "Dashboards to organize and intuitively display your dev server and tooling output.",
      abbreviation: "Dd",
      color: "#8bd48b",
      number: "17",
      link: "https://formidable.com/open-source/development-dashboards/"
    },
    {
      title: "React Animations",
      description:
        "A collection of animations that can be used with many inline style libraries, such as Radium or Aphrodite.",
      abbreviation: "Ra",
      color: "#86b9e6",
      number: "03",
      link: "https://formidable.com/open-source/react-animations"
    },
    {
      title: "Enzyme Matchers",
      description:
        "Run common assertions on your React components using Enzyme in a Jest or Jasmine environment.",
      abbreviation: "Em",
      color: "#e48055",
      number: "09",
      link: "https://formidable.com/open-source/jest-enzyme/"
    }
  ]
};

export default content;
