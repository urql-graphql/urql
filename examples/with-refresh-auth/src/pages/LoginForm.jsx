import React, { useEffect } from 'react';
import { gql, useMutation } from 'urql';

const LOGIN_MUTATION = gql`
  mutation Signin($input: LoginInput!) {
    signin(input: $input) {
      refreshToken
      token
    }
  }
`;

const LoginForm = ({ onLoginSuccess }) => {
  const [loginResult, login] = useMutation(LOGIN_MUTATION);
  const { data, fetching, error } = loginResult;

  const onSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.target);
    const username = data.get('username');
    const password = data.get('password');
    login({ input: { username, password } });
  };

  useEffect(() => {
    if (data && data.signin) {
      onLoginSuccess(data.signin);
    }
  }, [onLoginSuccess, data]);

  if (fetching) {
    return <p>loading...</p>;
  }

  return (
    <form onSubmit={onSubmit}>
      {error && <p>Oh no... {error.message}</p>}

      <label>
        Username:
        <input name="username" type="text" />
      </label>

      <label>
        Password:
        <input name="password" type="password" />
      </label>

      <input name="type" value="Login" type="submit" />
      <input name="type" value="Register" type="submit" />
    </form>
  );
};

export default LoginForm;
