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
export const ADD_TODO_MUTATION = `
    mutation ADD_TODO_MUTATION($text: String!, $complete: Boolean!){
        addTodo(text: $text, complete: $complete){
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