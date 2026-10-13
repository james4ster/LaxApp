import { useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

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
    <div>
      <h1>LaxLive</h1>

      <button onClick={handleGoogleLogin} disabled={connecting}>
        {connecting ? 'Connecting…' : 'Continue with Google'}
      </button>
      {errorMessage && <p role="alert">{errorMessage}</p>}
    </div>
  );
}