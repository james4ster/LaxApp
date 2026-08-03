import { supabase } from '../lib/supabase';

export default function Login() {

    async function handleGoogleLogin() {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });
      
        if (error) {
          console.error(error);
        }
      }

  return (
    <div>
      <h1>LaxLive</h1>

      <button onClick={handleGoogleLogin}>
        Continue with Google
      </button>
    </div>
  );
}