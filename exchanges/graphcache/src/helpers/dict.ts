export const makeDict = (): any => Object.create(null);

export const isDictEmpty = (x: any) => {
  for (const _ in x) return false;
  return true;
};
