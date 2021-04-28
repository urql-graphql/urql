import React, { useState } from "react";

import SearchResultPage from './components/SearchResultPage';

const limit = 5;
const query = "graphql";

const PaginatedNpmSearch = () => {
  const [pageVariables, setPageVariables] = useState([
     {
       query,
       first: limit,
       after: ""
     },
   ]);

  return (
    <div>
      {pageVariables.map((variables, i) => (
          <SearchResultPage
            key={"" + variables.after}
            variables={variables}
            isLastPage={i === pageVariables.length - 1}
            onLoadMore={(after) =>
              setPageVariables([...pageVariables, { after, first: limit, query }])
            }
          />
        )
      )}
    </div>
  );
};

export default PaginatedNpmSearch;
