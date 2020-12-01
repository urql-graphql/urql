// functions to produce objects representing entities => todos, writers, books, stores, employees
export const makeTodo = i => ({
    id: `${i}`,
    due: new Date(+new Date() - Math.floor(Math.random() * 10000000000)),
    text: `Todo ${i}`,
    complete: Boolean(i % 2),
});
export const makeWriter = i => ({
    id: `${i}`,
    name: `writer ${i}`,
    amountOfBooks: Math.random() * 100,
    recognised: Boolean(i % 2),
    number: i,
    interests: 'star wars',
});
export const makeBook = i => ({
    id: `${i}`,
    title: `book ${i}`,
    published: Boolean(i % 2),
    genre: 'Fantasy',
    rating: (i / Math.random()) * 100,
    release: new Date(+new Date() - Math.floor(Math.random() * 10000000000)),
});
export const makeStore = i => ({
    id: `${i}`,
    name: `store ${i}`,
    started: new Date(+new Date() - Math.floor(Math.random() * 10000000000)),
    country: countries[Math.floor(Math.random()) * 4],
});
export const makeEmployee = i => ({
    id: `${i}`,
    name: `employee ${i}`,
    dateOfBirth: new Date(+new Date() - Math.floor(Math.random() * 10000000000)),
    origin: countries[Math.floor(Math.random()) * 4],
});