import React, { useEffect, useState } from 'react';
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
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const [loginResult, login] = useMutation(LOGIN_MUTATION);

  const { data, fetching, error } = loginResult;

  const onUsernameChange = evt => {
    setUsername(evt.target.value);
  };

  const onPasswordChange = evt => {
    setPassword(evt.target.value);
  };

  const onSubmit = evt => {
    evt.preventDefault();
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

      <input type="text" onChange={onUsernameChange} />

      <input type="password" onChange={onPasswordChange} />

      <input type="submit" title="login" />
    </form>
  );
};

export default LoginForm;
