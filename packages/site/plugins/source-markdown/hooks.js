import { useRouteData } from 'react-static';

export const useMarkdownPage = () => {
  const pageData = useRouteData();
  if (!pageData.frontmatter) return;

  return {
    path: pageData.path,
    originalPath: pageData.originalPath,
    frontmatter: pageData.frontmatter,
  };
};

export const useMarkdownTree = () => {
  return useRouteData().pages;
};
