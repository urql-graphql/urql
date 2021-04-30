import React, { useMemo, useState, useEffect } from 'react';
import { getToken, saveAuthData } from './Store';

export const AuthContext = React.createContext();

export const AuthContextProvider = props => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const authContext = useMemo(
    () => ({
      isLoggedIn,
      onLoginSuccess: ({ token, refreshToken }) => {
        setIsLoggedIn(!!token);
        saveAuthData({ token, refreshToken });
      },
    }),
    [isLoggedIn]
  );

  useEffect(() => {
    setIsLoggedIn(!!getToken());
  }, []);

  return (
    <AuthContext.Provider value={authContext}>
      {props.children}
    </AuthContext.Provider>
  );
};
