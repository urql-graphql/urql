const mutation = (q, vars = {}) => {
  return {
    query: q,
    variables: vars
  };
};

export default mutation;