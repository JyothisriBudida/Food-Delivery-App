import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Auth.css";

function Login() {
  const navigate = useNavigate();
  const { currentUser, login, signup } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (isSignup) {
        await signup(email, password, displayName.trim());
      } else {
        await login(email, password);
      }

      navigate("/", { replace: true });
    } catch (authError) {
      setError(authError.message || "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-panel" onSubmit={handleSubmit}>
        <h1>{isSignup ? "Create Account" : "Sign In"}</h1>

        {isSignup && (
          <label>
            Name
            <input
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              autoComplete="name"
              required
            />
          </label>
        )}

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label>
          Password
          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={isSignup ? "new-password" : "current-password"}
              minLength={6}
              required
            />
            <button
              type="button"
              className="password-visibility"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              title={showPassword ? "Hide password" : "Show password"}
            >
              <span
                aria-hidden="true"
                className={`password-eye ${showPassword ? "visible" : ""}`}
              >
                &#128065;
              </span>
            </button>
          </div>
        </label>

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" className="auth-submit" disabled={submitting}>
          {submitting ? "Please wait..." : isSignup ? "Sign Up" : "Sign In"}
        </button>

        <button
          type="button"
          className="auth-toggle"
          onClick={() => {
            setError("");
            setIsSignup((value) => !value);
          }}
        >
          {isSignup ? "I already have an account" : "Create a new account"}
        </button>
      </form>
    </div>
  );
}

export default Login;
