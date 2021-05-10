import React from 'react';
import { gql, useMutation } from 'urql';

const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    signin(input: $input) {
      refreshToken
      token
    }
  }
`;

const REGISTER_MUTATION = gql`
  mutation Register($input: LoginInput!) {
    register(input: $input) {
      refreshToken
      token
    }
  }
`;

const LoginForm = ({ onLoginSuccess }) => {
  const [loginResult, login] = useMutation(LOGIN_MUTATION);
  const [registerResult, register] = useMutation(REGISTER_MUTATION);

  const onSubmitLogin = event => {
    event.preventDefault();
    const data = new FormData(event.target);
    const username = data.get('username');
    const password = data.get('password');

    login({ input: { username, password } }).then(result => {
      if (!result.error && result.data && result.data.signin) {
        onLoginSuccess(result.data.signin);
      }
    });
  };

  const onSubmitRegister = event => {
    event.preventDefault();
    const data = new FormData(event.target);
    const username = data.get('username');
    const password = data.get('password');

    register({ input: { username, password } }).then(result => {
      if (!result.error && result.data && result.data.register) {
        onLoginSuccess(result.data.register);
      }
    });
  };

  const disabled = loginResult.fetching || registerResult.fetching;

  return (
    <>
      <form onSubmit={onSubmitLogin}>
        {loginResult.fetching ? <p>Logging in...</p> : null}
        {loginResult.error ? <p>Oh no... {loginResult.error.message}</p> : null}

        <fieldset disabled={disabled ? 'disabled' : null}>
          <h3>Login</h3>
          <label>
            Username:
            <input name="username" type="text" />
          </label>

          <label>
            Password:
            <input name="password" type="password" />
          </label>

          <button type="submit">Login</button>
        </fieldset>
      </form>

      <form onSubmit={onSubmitRegister}>
        {registerResult.fetching ? <p>Signing up...</p> : null}
        {registerResult.error ? (
          <p>Oh no... {registerResult.error.message}</p>
        ) : null}

        <fieldset disabled={disabled ? 'disabled' : null}>
          <h3>Register</h3>
          <label>
            {'Username: '}
            <input name="username" type="text" />
          </label>

          <label>
            {'Password: '}
            <input name="password" type="password" />
          </label>

          <button type="submit">Register</button>
        </fieldset>
      </form>
    </>
  );
};

export default LoginForm;
