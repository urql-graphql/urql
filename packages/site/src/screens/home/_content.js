const content = {
  header: {
    hero: {
      copyText: 'npm install urql graphql',
    },
  },
  features: [
    {
      title: 'Performant and functional',
      description:
        'Lightweight, powerful, and easy to use; urql is a great alternative to bulky GraphQL clients.',
      icon: require('../../assets/gql-tile.svg'),
    },
    {
      title: 'Extensible library that grows with you',
      description:
        'Want to change how you fetch, cache, or subscribe to data? The urql exchanges allow you to customize your data layer to suit your needs.',
      icon: require('../../assets/eagle-tile.svg'),
    },
    {
      title: 'Logical default behavior and caching',
      description:
        'Adding urql enables you to rapidly use GraphQL in your apps without complex configuration or large API overhead.',
      icon: require('../../assets/clock-tile.svg'),
    },
  ],
  components: {
    title: 'Minimal React Components and Hooks',
    description:
      "Whether you prefer a <Query> component or useQuery Hook, urql's API is intuitive to use, with full support for GraphQL Queries, Mutations and Subscriptions in both styles!",
    icon: require('../../assets/react-tile.svg'),
  },
  preview: {
    description: '',
    media: '',
  },
  getStarted: {
    description: `With its intuitive set of lightweight API's, getting started with urql is a breeze. Dive into the documentation to get up and running in minutes.`,
    link: '/docs',
  },
  oss: [
    {
      title: 'Victory',
      description:
        'An ecosystem of modular data visualization components for React. Friendly and flexible.',
      logo: require('../../assets/badge_victory.svg'),
      link: 'https://formidable.com/open-source/victory',
    },
    {
      title: 'urql',
      description:
        'Universal React Query Library is a blazing-fast GraphQL client, exposed as a set of ReactJS components.',
      logo: require('../../assets/sidebar-badge.svg'),
      link: 'https://formidable.com/open-source/urql/',
    },
    {
      title: 'Spectacle',
      description:
        'A React.js based library for creating sleek presentations using JSX syntax that gives you the ability to live demo your code.',
      logo: require('../../assets/badge_spectacle.svg'),
      link: 'https://formidable.com/open-source/spectacle/',
    },
    {
      title: 'Runpkg',
      description:
        'The online package explorer. Runpkg turns any npm package into an interactive and informative browsing experience',
      logo: require('../../assets/badge_runpkg.svg'),
      link: 'https://www.runpkg.com/',
    },
  ],
};

export default content;
