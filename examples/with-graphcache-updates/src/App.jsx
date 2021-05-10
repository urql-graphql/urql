import React, { useState, useEffect } from "react";
import { Provider } from "urql";

import client from "./client";
import Links from "./pages/Links";
import LoginForm from "./pages/LoginForm";

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

function App() {
  return (
    <Provider value={client}>
      <Home />
    </Provider>
  );
}

export default App;
