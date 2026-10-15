import { useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import './Login.css';

export default function Login() {
  const [connecting, setConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleGoogleLogin() {
    if (!isSupabaseConfigured) {
      setErrorMessage(
        'Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local, then restart the dev server.'
      );
      return;
    }

    setConnecting(true);
    setErrorMessage('');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setConnecting(false);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to start Google sign-in.');
      setConnecting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-showcase" aria-label="LaxTrack">
        <div className="login-brand">
          <img src="/favicon.jpg" alt="" className="login-brand-mark" />
          <span>LaxTrack</span>
        </div>
        <div className="login-hero">
          <div className="login-eyebrow"><span /> THE GAME, IN REAL TIME</div>
          <h1>Every play.<br /><span>Every number.</span></h1>
          <p>Keep your team connected with live stats, clear insights, and a better view of every game.</p>
        </div>
        <div className="login-showcase-footer">
          <span className="login-live-mark" />
          Built for the sideline. Made for the whole team.
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="login-mobile-brand">
            <img src="/favicon.jpg" alt="" className="login-brand-mark" />
            <span>LaxTrack</span>
          </div>
          <div className="login-card-kicker">TEAM ACCESS</div>
          <h2>Welcome back</h2>
          <p className="login-card-copy">Sign in to manage your team and follow the action.</p>

          <button
            className="login-google-button"
            onClick={handleGoogleLogin}
            disabled={connecting}
          >
            <span className="login-google-mark" aria-hidden="true">G</span>
            <span>{connecting ? 'Connecting…' : 'Continue with Google'}</span>
            {!connecting && <span className="login-button-arrow" aria-hidden="true">→</span>}
          </button>

          {errorMessage && (
            <p className="login-error" role="alert">{errorMessage}</p>
          )}
          <p className="login-secure-note">
            <span aria-hidden="true">◆</span>
            Secure sign-in for coaches and team managers
          </p>
        </div>
        <div className="login-panel-footer">© {new Date().getFullYear()} LaxTrack</div>
      </section>
    </main>
  );
}
