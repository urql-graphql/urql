// create operations, i.e., queries & mutations, to be performed
export const ALL_TODOS_QUERY = `
    query ALL_TODOS_QUERY {
        todos {
            id,
            text,
            complete
        }
    }
`;
export const ALL_WRITERS_QUERY = `
    query ALL_WRITERS_QUERY {
        writers {
            id,
            name,
            amountOfBooks,
            recognized,
            number,
            interests
        }
    }
`;
export const ALL_BOOKS_QUERY = `
    query ALL_BOOKS_QUERY {
        books {
            id,
            title,
            published,
            genre,
            rating
        }
    }
`;
export const ALL_STORES_QUERY = `
    query ALL_STORES_QUERY {
        stores {
            id,
            name,
            country
        }
    }
`;
export const ALL_EMPLOYEES_QUERY = `
    query ALL_EMPLOYEES_QUERY {
        employees {
            id,
            name,
            origin
        }
    }
`;
export const ALL_AUTHORS_QUERY = `
    query ALL_AUTHORS_QUERY {
        authors {
            id,
            name,
            recognized,
            book
        }
    }
`;
export const ADD_TODO_MUTATION = `
    mutation ADD_TODO_MUTATION($text: String!, $complete: Boolean!){
        addTodo(text: $text, complete: $complete){
            id,
            text,
            complete
        }
    }
`;
export const UPDATE_TODO_MUTATION = `
    mutation UPDATE_TODO_MUTATION($id: ID!, $complete: Boolean!){
        updateTodo(id: $id, complete: $complete){
            id,
            text,
            complete
        }
    }
`;
export const ADD_TODOS_MUTATION = `
    mutation ADD_TODOS_MUTATION($newTodos: NewTodosInput!){
        addTodos(newTodos: $newTodos){
            id,
            text,
            complete
        }
    }
`;
export const ADD_WRITERS_MUTATION = `
    mutation ADD_WRITERS_MUTATION($newWriters: NewWritersInput!){
        addWriters(newWriters: $newWriters){
            id,
            name,
            amountOfBooks,
            recognized,
            number,
            interests
        }
    }
`;
export const ADD_BOOKS_MUTATION = `
    mutation ADD_BOOKS_MUTATION($newBooks: NewBooksInput!){
        addBooks(newBooks: $newBooks){
            id,
            title,
            published,
            genre,
            rating
        }
    }
`;
export const ADD_STORES_MUTATION = `
    mutation ADD_STORES_MUTATION($newStores: NewStoresInput!){
        addStores(newStores: $newStores){
            id,
            name,
            country
        }
    }
`;
export const ADD_EMPLOYEES_MUTATION = `
    mutation ADD_EMPLOYEES_MUTATION($newEmployees: NewEmployeesInput!){
        addEmployees(newEmployees: $newEmployees){
            id,
            name,
            origin
        }
    }
`;
export const ADD_AUTHORS_MUTATION = `
    mutation ADD_AUTHORS_MUTATION($newAuthors: NewAuthorsInput!){
        addAuthors(newAuthors: $newAuthors){
            id
            name
            recognized
            book
        }
    }
`;
