import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import AuthPage from "./AuthPage";
import { auth, onAuthStateChanged, signOut } from "./firebase";

function Root() {
  const [user, setUser]       = useState(undefined); // undefined = loading
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) {
    return (
      <div className="auth-init-loader">
        <div className="auth-init-spinner" />
      </div>
    );
  }

  if (!user) return <AuthPage />;

  return <App user={user} onSignOut={() => signOut(auth)} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
