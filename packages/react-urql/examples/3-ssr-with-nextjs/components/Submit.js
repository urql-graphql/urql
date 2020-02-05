import React, { useCallback } from 'react';
import { useMutation } from 'urql';
import gql from 'graphql-tag';

const createPostMutation = gql`
  mutation createPost($title: String!, $url: String!) {
    createPost(title: $title, url: $url) {
      id
      title
      votes
      url
      createdAt
    }
  }
`;

export default function Submit() {
  const [_, executeMutation] = useMutation(createPostMutation);

  const handleSubmit = useCallback(
    event => {
      event.preventDefault();
      const form = event.target;
      const formData = new window.FormData(form);
      const title = formData.get('title');
      const url = formData.get('url');
      form.reset();

      executeMutation({
        title, 
        url 
      });
    },
    [executeMutation]
  );

  return (
    <form onSubmit={handleSubmit}>
      <h1>Submit</h1>
      <input placeholder="title" name="title" type="text" required />
      <input placeholder="url" name="url" type="url" required />
      <button type="submit">Submit</button>

      <style jsx>{`
        form {
          border-bottom: 1px solid #ececec;
          padding-bottom: 20px;
          margin-bottom: 20px;
        }
        h1 {
          font-size: 20px;
        }
        input {
          display: block;
          margin-bottom: 10px;
        }
      `}</style>
    </form>
  );
}
