import React, { useEffect, useState } from 'react';

import { getToken, saveAuthData } from '../auth/Store';
import Profile from './Profile';
import LoginForm from './LoginForm';

const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const onLoginSuccess = auth => {
    setIsLoggedIn(true);
    saveAuthData(auth);
  };

  useEffect(() => {
    if (getToken()) {
      setIsLoggedIn(true);
    }
  }, []);

  return isLoggedIn ? (
    <Profile />
  ) : (
    <LoginForm onLoginSuccess={onLoginSuccess} />
  );
};

export default Home;
