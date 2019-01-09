/* eslint-disable max-len, no-unused-vars */
const IconInternalLink = `<svg viewBox="0 0 20 20" width="20" height="20"><path d="M16.3 10L11 15.2l-1.3-1.3 3-2.9h-9V9h8.9L9.7 6 11 4.8l5.3 5.2z" fill="inherit"/></svg>`;

const IconExternalLink = `<svg viewBox="0 0 20 20" width="20" height="20"><path fill="inherit" d="M14.2 16.8h-11V5.7H9V5H2.4v12.5h12.5V11h-.7"/><path d="M18.4 1.6V9h-1.9V4.8l-6.3 6.3-1.3-1.3 6.3-6.3H11V1.6h7.4z" fill="inherit"/></svg>`;

export default {
  link: (href, title, text) => {
    const Icon = href.includes("formidable.com")
      ? IconInternalLink
      : IconExternalLink;

    return `<a href=${href} title=${title || ""}>
        ${text} <span style="margin: 0; padding: 0; display: inline-block; vertical-align: middle;">${Icon}</span>
      </a>`;
  }
};
