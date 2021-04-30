import React, { useContext } from 'react';

import { AuthContext } from '../auth/AuthContext';
import LoginForm from './LoginForm';
import Profile from './Profile';

const Home = () => {
  const { isLoggedIn } = useContext(AuthContext);

  return isLoggedIn ? <Profile /> : <LoginForm />;
};

export default Home;
