const query = (q, vars) => {
  return {
    query: q,
    variables: vars || {}
  };
};

export default query;