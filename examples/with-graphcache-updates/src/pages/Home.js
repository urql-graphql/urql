import React, { useEffect, useState } from 'react';

import Links from './Links';
import LoginForm from './LoginForm';

const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const onLoginSuccess = auth => {
    localStorage.setItem("authToken", auth.token);
    setIsLoggedIn(true);
  };

  useEffect(() => {
    if (localStorage.getItem("authToken")) {
      setIsLoggedIn(true);
    }
  }, []);

  return isLoggedIn ? (
    <Links />
  ) : (
    <LoginForm onLoginSuccess={onLoginSuccess} />
  );
};

export default Home;
