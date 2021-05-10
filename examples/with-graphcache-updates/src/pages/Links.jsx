import React, { useEffect } from "react";
import { gql, useQuery, useMutation } from "urql";

const LINKS_QUERY = gql`
  query Links($first: Int!) {
    links(first: $first) {
      nodes {
        id
        title
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
        title
        canonicalUrl
      }
    }
  }
`;

const Links = () => {
  const [linksResult] = useQuery({ query: LINKS_QUERY, variables: { first: 10 } });
  const [createResult, createLink] = useMutation(CREATE_LINK_MUTATION)

  const onSubmitLink = (event) => {
    event.preventDefault();
    const { target } = event;
    createLink({ url: new FormData(target).get('link') })
      .then(() => target.reset());
  };

  return (
    <div>
      {linksResult.error && <p>Oh no... {linksResult.error.message}</p>}

      {linksResult.data && (
        <ul>
          {linksResult.data.links.nodes.map((link) => (
            <li key={link.id}>
              <a rel="noreferrer" href={link.canonicalUrl}>
                {link.title}
              </a>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={onSubmitLink}>
        {createResult.fetching ? <p>Submitting...</p> : null}
        {createResult.error ? <p>Oh no... {createResult.error.message}</p> : null}

        <fieldset disabled={createResult.fetching ? 'disabled' : null}>
          <label>
            {'Link to Blog Post: '}
            <input type="url" name="link" placeholder="https://..."/>
          </label>
          <button type="submit">Add Link</button>
        </fieldset>
      </form>
    </div>
  );
};

export default Links;
