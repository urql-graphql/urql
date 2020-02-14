// Environmental variables by stage in react-static 5.9.12
// react-static start, aka development: REACT_STATIC_ENV="development" && REACT_STATIC_STAGING=undefined
// react-static stage, aka staging: REACT_STATIC_ENV="production" && REACT_STATIC_STAGING="true"
// react-static build, aka production:  REACT_STATIC_ENV="production" && REACT_STATIC_STAGING=undefined

const stage =
  process.env.REACT_STATIC_STAGING === 'true'
    ? 'staging'
    : process.env.REACT_STATIC_ENV;
const landerBasePath = 'open-source/urql';
const metaData = {
  title: 'urql',
  description:
    'A GraphQL client that exposes a set of React components and hooks.',
  url: 'http://www.formidable.com/open-source/urql/',
};

module.exports = { stage, landerBasePath, metaData };
