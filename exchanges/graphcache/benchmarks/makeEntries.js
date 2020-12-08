// create a function that will take in a number of times to be run and a function that will produce an entry/entity
export const makeEntries = (amount, makeEntry) => {
  // create array of entries to be outputted
  const entries = [];
  // iterate from 0 up to the amount inputted
  for (let i = 0; i < amount; i += 1) {
    // each iteration, create an entry and pass it the current index & push it into output array
    const entry = makeEntry(i);
    entries.push(entry);
  }
  // return array of entries
  return entries;
};
