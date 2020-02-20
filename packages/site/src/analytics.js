import React, { Fragment } from 'react';
import PropTypes from 'prop-types';

let GoogleAnalytics = null;
if (typeof window !== 'undefined') {
  GoogleAnalytics = require('react-router-ga');
  if (GoogleAnalytics.default) GoogleAnalytics = GoogleAnalytics.default;
}

export const Analytics = props =>
  !GoogleAnalytics ? (
    <GoogleAnalytics {...props} />
  ) : (
    <Fragment>{props.children}</Fragment>
  );

Analytics.propTypes = {
  children: PropTypes.element,
};
