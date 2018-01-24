const query = (q: string, vars?: object) => {
  return {
    query: q,
    variables: vars || {},
  };
};

export default query;
