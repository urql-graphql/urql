import { useRouteData } from 'react-static';

export const useMarkdownPage = () => {
  const currentPageData = useRouteData();

  return {
    ...currentPageData,
    pages: undefined,
  };
};
export const useMarkdownTree = () => {
  return useRouteData().pages;
};
