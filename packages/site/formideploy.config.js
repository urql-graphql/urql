/**
 * Formideploy configuration overrides.
 */
module.exports = {
  lander: {
    name: 'urql',
  },
  production: {
    // TODO: temp retarget when we have verified this working
    domain: 'tmp-experiment-02.formidable.com',
    bucket: 'tmp-experiment-02.formidable.com',
  },
};
