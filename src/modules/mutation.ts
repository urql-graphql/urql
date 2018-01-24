const mutation = (q: string, vars = {}) => {
  return {
    query: q,
    variables: vars,
  };
};

export default mutation;
