/* eslint-disable func-style */
// we can switch to single-function lodash deps like the cool kids once we've got feature parity,
// keeping in mind this is naught but the build step.
const _ = require('lodash');
const path = require('path');
const getMdFiles = require('./get-md-files');

const capitalizeSlugComponent = word => {
  // this is suboptimal, we should be able to define page
  // titles as we want them instead of relying on the slug
  switch (word) {
    case 'and':
      return 'and';
    case 'api':
      return 'API';
    default:
      return _.upperFirst(word);
  }
};

const sidebarTitleSlugMutation = (mdData, mdPath) => {
  const { name } = path.parse(mdPath);

  mdData.slug = name.toLowerCase();
  mdData.path = `/${name.toLowerCase()}/`;
  mdData.title = name
    .split('-')
    .map(capitalizeSlugComponent)
    .join(' ');
};

const sidebarSort = items => _.orderBy(items, ['data.order'], 'asc');

function getSidebarItems(
  mdPath = 'src/content/docs/',
  items = [],
  mutations = [sidebarTitleSlugMutation],
  sort = sidebarSort
) {
  return getMdFiles(mdPath, items, mutations, sort);
}

module.exports = {
  getSidebarItems,
};
