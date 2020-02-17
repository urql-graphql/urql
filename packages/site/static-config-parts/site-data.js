import theme from '../src/styles/theme';
import constants from '../src/constants';
/* eslint-disable max-len */
export default {
  siteTitle: 'Urql', // Site title.,
  siteDescription: 'Urql Documentation',
  siteTitleAlt: 'Urql.js React Charting Library', // Alternative site title for SEO.
  siteLogo: '/logos/favicon.ico', // Logo used for SEO and manifest.
  siteUrl: 'https://formidable.com', // Domain of your website without pathPrefix.
  pathPrefix: '/open-source/urql', // Prefixes all links when deployed (amazing).
  googleAnalyticsID: 'UA-43290258-1', // GA tracking ID.
  projectLinks: [
    {
      label: 'Support',
      url: 'https://spectrum.chat/urql',
    },
    {
      label: 'GitHub',
      url: 'https://github.com/FormidableLabs/urql',
    },
  ],
  copyright: 'Copyright © 2020. Formidable', // Copyright string for the footer of the website and RSS feed.
  themeColor: theme.color.blue, // Used for setting manifest and progress theme colors.
  backgroundColor: theme.color.lightGray, // Used for setting manifest background color.
};
/* eslint-enable max-len */
