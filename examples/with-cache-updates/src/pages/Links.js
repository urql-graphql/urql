import React, {useEffect, useState} from "react";
import { gql, useQuery, useMutation } from "urql";

const LINKS_QUERY = gql`
  query Links($first: Int!) {
    links(first: $first) {
      nodes {
        id
        canonicalUrl
      }
    }
  }
`;

const CREATE_LINK_MUTATION = gql`
  mutation CreateLink($url: URL!) {
    createLink(url: $url) {
      node {
        id
        canonicalUrl
      }
    }
  }
`;

const Links = () => {
  const [newLink, setNewLink] = useState("");

  const [linksResult] = useQuery({ query: LINKS_QUERY, variables: { first: 10 } });
  const [createResult, createLink] = useMutation(CREATE_LINK_MUTATION)

  const onChangeLink = evt => {
    setNewLink(evt.target.value);
  }

  const onSubmit = evt => {
    evt.preventDefault();
    createLink({ url: newLink });
  };

  useEffect(() => {
    if (createResult.data) {
      setNewLink("");
    }
  }, [createResult]);

  if (linksResult.fetching || createResult.fetching) {
    return <p>Loading...</p>
  }

  return (
    <div>
      {linksResult.error && <p>Oh no... {linksResult.error.message}</p>}

      {linksResult.data && (
        <ul>
          {linksResult.data.links.nodes.map((link) => (
            <li key={link.id}>{link.canonicalUrl}</li>
          ))}
        </ul>
      )}

      <form onSubmit={onSubmit}>
        {createResult.error && <p>Oh no... {createResult.error.message}</p>}

        <input onChange={onChangeLink} value={newLink} />

        <input type="submit" title="add" />
      </form>
    </div>
  );
};

export default Links;
