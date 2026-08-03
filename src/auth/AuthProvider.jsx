import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("CURRENT URL:", window.location.href);
    console.log("HASH:", window.location.hash);

    async function initializeAuth() {

      // Handle OAuth callback
      if (window.location.hash.includes('access_token')) {

        const { data, error } = await supabase.auth.setSession({
          access_token: new URLSearchParams(
            window.location.hash.substring(1)
          ).get('access_token'),

          refresh_token: new URLSearchParams(
            window.location.hash.substring(1)
          ).get('refresh_token'),
        });

        console.log('OAuth setSession:', data.session);
        console.log('OAuth error:', error);

        if (data.session) {
          setUser(data.session.user);

          // Remove tokens from browser URL
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );

          setLoading(false);
          return;
        }
      }

      // Normal app load
      const { data } = await supabase.auth.getSession();

      console.log('Existing session:', data.session);

      setUser(data.session?.user ?? null);
      setLoading(false);
    }

    initializeAuth();


    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log('Auth change:', session);
        setUser(session?.user ?? null);
      }
    );


    return () => {
      subscription.unsubscribe();
    };

  }, []);


  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  return useContext(AuthContext);
}