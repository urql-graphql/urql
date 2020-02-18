import { useRouteData } from 'react-static';

export const useMarkdownPage = () => {
  const currentPageData = useRouteData();

  return {
    ...currentPageData,
    pages: undefined,
  };
};
export const useMarkdownPages = () => {
  return useRouteData().pages;
};
export const useMarkdownTree = () => {
  return useMarkdownPages().reduce((acc, page) => {
    const sectionIndex = acc.findIndex(a => a.section === page.section);
    if (sectionIndex === -1) {
      return [
        ...acc,
        {
          section: page.section,
          pages: [page],
        },
      ];
    }

    acc[sectionIndex].pages = [...acc[sectionIndex].pages, page];
    return acc;
  }, []);
};
