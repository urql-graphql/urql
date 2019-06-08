import React, { useCallback } from 'react';
import { useMutation } from 'urql';
import gql from 'graphql-tag';

const updatePostMutation = gql`
  mutation updatePost($id: ID!, $votes: Int) {
    updatePost(id: $id, votes: $votes) {
      id
      __typename
      votes
    }
  }
`;

export default function PostUpvoter({ votes, id }) {
  const [_, executeMutation] = useMutation(updatePostMutation);

  const upvotePost = useCallback(() => {
    executeMutation({
      id,
      votes: votes + 1,
    });
  }, [votes, id, executeMutation]);

  return (
    <button onClick={upvotePost}>
      {votes}

      <style jsx>{`
        button {
          background-color: transparent;
          border: 1px solid #e4e4e4;
          color: #000;
        }
        button:active {
          background-color: transparent;
        }
        button:before {
          align-self: center;
          border-color: transparent transparent #000000 transparent;
          border-style: solid;
          border-width: 0 4px 6px 4px;
          content: '';
          height: 0;
          margin-right: 5px;
          width: 0;
        }
      `}</style>
    </button>
  );
}
