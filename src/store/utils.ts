export const assignObjectToMap = <T>(
  map: Map<string, T>,
  obj: { [key: string]: T }
) => {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      map.set(key, obj[key]);
    }
  }
};

export const objectOfMap = <T>(map: Map<string, T>): { [key: string]: T } => {
  const res = {};
  map.forEach((value, key) => {
    res[key] = value;
  });
  return res;
};
