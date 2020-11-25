// create a function that will produce Todo entries
// will take in number relative to iterator count
export const makeTodo = num => ({
    id: `${num}`,
    text: `Todo ${num}`,
    complete: Boolean(num % 2),
});