const mutation = (q: string, vars?: object) => {
  return {
    query: q,
    variables: vars || {},
  };
};

export default mutation;
