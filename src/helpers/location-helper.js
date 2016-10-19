export default (location) => {
  return location[location.length - 1] !== "/" && process.env.NODE_ENV === "production"
    ? `${location}/`
    : location;
};
