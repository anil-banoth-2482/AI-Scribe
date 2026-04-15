import { useState } from "react";
import {
  auth,
  googleProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
} from "./firebase";

/* ── Google logo SVG ──────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      <path fill="none" d="M0 0h48v48H0z"/>
    </svg>
  );
}

/* ── Mouse-repelling particle field for auth background ── */
function AuthParticleField() {
  return null;
}

export default function AuthPage() {
  const [mode, setMode] = useState("login"); // "login" | "signup" | "reset"
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]         = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]   = useState("");
  const [resetSent, setResetSent] = useState(false);

  const clearErr = () => setError("");

  /* ── helpers ─────────────────────────────────────── */
  const friendlyError = (code) => {
    // Log raw code so you can always see it in browser console
    console.error("[Firebase auth error]", code);
    const map = {
      "auth/invalid-email":                "That doesn't look like a valid email address.",
      "auth/user-not-found":               "No account found with that email.",
      "auth/wrong-password":               "Incorrect password. Try again or reset it.",
      "auth/email-already-in-use":         "An account with that email already exists.",
      "auth/weak-password":                "Password must be at least 6 characters.",
      "auth/too-many-requests":            "Too many attempts. Please wait a moment.",
      "auth/popup-closed-by-user":         "Google sign-in was cancelled.",
      "auth/network-request-failed":       "Network error. Check your connection.",
      "auth/invalid-credential":           "Email or password is incorrect.",
      "auth/operation-not-allowed":        "This sign-in method is not enabled in Firebase console.",
      "auth/configuration-not-found":      "Firebase auth is not configured correctly.",
      "auth/admin-restricted-operation":   "This sign-in method is not enabled. Enable Email/Password in Firebase console.",
      "auth/unauthorized-domain":          "This domain is not authorised. Add localhost to Firebase -> Authentication -> Settings -> Authorised domains.",
      "auth/cancelled-popup-request":      "Sign-in cancelled.",
      "auth/popup-blocked":                "Popup was blocked by your browser. Please allow popups for this site.",
      "auth/redirect-cancelled-by-user":   "Google sign-in was cancelled.",
      "auth/user-disabled":                "This account has been disabled.",
      "auth/missing-email":                "Please enter your email address.",
    };
    return map[code] || `Something went wrong (${code}). Please try again.`;
  };

  /* ── Google sign-in (popup — reliable on localhost unlike redirect) ── */
  const handleGoogle = async () => {
    clearErr();
    setGoogleLoading(true);
    try {
      // Popup opens in a child window — auth state is picked up by onAuthStateChanged in main.jsx
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged in main.jsx will handle the signed-in user automatically
    } catch (e) {
      setError(friendlyError(e.code));
    } finally {
      setGoogleLoading(false);
    }
  };

  /* ── Email / password ────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    clearErr();
    // Delegate to reset handler when in reset mode
    if (mode === "reset") return handleReset(e);
    if (!email.trim() || !password) return;
    setLoading(true);
    try {
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (displayName.trim()) {
          await updateProfile(cred.user, { displayName: displayName.trim() });
        }
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (e) {
      setError(friendlyError(e.code));
    } finally {
      setLoading(false);
    }
  };

  /* ── Password reset ──────────────────────────────── */
  const handleReset = async (e) => {
    e.preventDefault();
    clearErr();
    if (!email.trim()) { setError("Enter your email address first."); return; }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
    } catch (e) {
      setError(friendlyError(e.code));
    } finally {
      setLoading(false);
    }
  };

  /* ── Reset-sent screen ─────────────────────────── */
  if (resetSent) {
    return (
      <div className="auth-page">
        <AuthParticleField />
        <div className="auth-bg-orb auth-orb1" />
        <div className="auth-bg-orb auth-orb2" />
        <div className="auth-bg-orb auth-orb3" />
        <div className="auth-card">
          <div className="auth-logo">
            <span className="auth-logo-text">Meet<span className="auth-accent">AI</span> Scribe</span>
          </div>
          <div className="auth-reset-sent">
            <h2 className="auth-reset-title">Check your inbox</h2>
            <p className="auth-reset-body">
              We've sent a password reset link to <strong>{email}</strong>.
              Check your spam folder if you don't see it.
            </p>
            <button className="auth-btn auth-btn-ghost" onClick={() => { setResetSent(false); setMode("login"); }}>
              Back to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <AuthParticleField />
      <div className="auth-bg-orb auth-orb1" />
      <div className="auth-bg-orb auth-orb2" />
      <div className="auth-bg-orb auth-orb3" />

      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <span className="auth-logo-text">Meet<span className="auth-accent">AI</span> Scribe</span>
        </div>

        {/* Title */}
        <h1 className="auth-title">
          {mode === "login"  && "Welcome back"}
          {mode === "signup" && "Create your account"}
          {mode === "reset"  && "Reset your password"}
        </h1>
        <p className="auth-subtitle">
          {mode === "login"  && "Sign in to access your meeting summaries."}
          {mode === "signup" && "Join to start recording and summarizing meetings."}
          {mode === "reset"  && "Enter your email and we'll send you a reset link."}
        </p>

        {/* Google button */}
        {mode !== "reset" && (
          <>
            <button
              className="auth-google-btn"
              onClick={handleGoogle}
              disabled={googleLoading || loading}
              id="google-signin-btn"
            >
              {googleLoading
                ? <span className="auth-spinner" />
                : <GoogleIcon />
              }
              <span>{mode === "signup" ? "Sign up with Google" : "Continue with Google"}</span>
            </button>
            <div className="auth-divider">
              <span className="auth-divider-line" />
              <span className="auth-divider-text">or</span>
              <span className="auth-divider-line" />
            </div>
          </>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Full name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="auth-input"
            />
          )}
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
          />
          {mode !== "reset" && (
            <div className="auth-pw-wrap">
              <input
                type={showPw ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input auth-pw-input"
              />
              {password && (
                <button
                  type="button"
                  className="auth-pw-toggle"
                  onClick={() => setShowPw(!showPw)}
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              )}
            </div>
          )}
          {error && <div className="auth-error">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="auth-btn auth-btn-primary"
          >
            {loading
              ? <span className="auth-spinner" />
              : <>
                  {mode === "login" && "Sign In"}
                  {mode === "signup" && "Create Account"}
                  {mode === "reset" && "Send Reset Link"}
                </>
            }
          </button>
        </form>

        {/* Links */}
        <div className="auth-links">
          {mode === "reset" && (
            <button
              type="button"
              className="auth-link"
              onClick={() => setMode("login")}
            >
              Back to sign in
            </button>
          )}
          {mode !== "reset" && (
            <>
              {mode === "login" ? (
                <>
                  <button
                    type="button"
                    className="auth-link"
                    onClick={() => { setMode("signup"); setError(""); }}
                  >
                    Create account
                  </button>
                  <button
                    type="button"
                    className="auth-link"
                    onClick={() => { setMode("reset"); setError(""); }}
                  >
                    Forgot password?
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="auth-link"
                  onClick={() => { setMode("login"); setError(""); }}
                >
                  Already have an account? Sign in
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
