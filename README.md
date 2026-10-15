# LaxLive

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` in the project root.
3. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to the values from your Supabase project.
4. Start the app with `npm run dev`. In Codespaces, open the forwarded port 5173 URL.

Vite reads `.env.local` when the dev server starts, so restart `npm run dev` after changing it. The dev server binds to the container interface so the Codespaces port forward can reach it.

## Enable Google sign-in

1. In Supabase, open **Authentication → Sign In / Providers → Google** and enable the provider. Add the OAuth client ID and client secret from your Google Cloud OAuth client.
2. In Google Cloud, add the Supabase callback URI shown in the Supabase Google provider settings as an authorized redirect URI. It has the form `https://<project-ref>.supabase.co/auth/v1/callback`.
3. In Supabase **Authentication → URL Configuration**, set the Site URL to your app URL and add that URL to the redirect URL allow list. For local Vite development, allow `http://localhost:5173/**`; in Codespaces, allow the forwarded `https://<codespace>-5173.app.github.dev/**` URL.

The app redirects back to the current origin after Google sign-in. If sign-in fails, the login screen displays the error.

## App icon

Replace `public/favicon.jpg` to change the app icon. `index.html` uses it for browser tabs and the Apple touch icon, and `public/manifest.webmanifest` uses it for browsers that install the app to a home screen. Use a square, high-resolution image; after changing it, browsers or home-screen shortcuts may need their cached icon refreshed.

## Season-long fan link and audience counts

The fan link is `/live/<team-slug>` and is shown on the team's manager page. It selects the live game, next scheduled game, or most recent final game, so fans can keep the same link throughout the season. Use a stable deployed domain for sharing; Codespaces preview URLs are for development and may change.

When a fan opens that link in their mobile browser, the app remembers it for the installed home-screen app. Since the PWA manifest starts at `/`, launching the installed app restores the saved season fan link instead of showing the coach login.

The game-start panel's per-game fan QR is a separate link. Share the team-level Fan link from the manager page for a season-long URL.

To enable audience counts, run [`supabase/migrations/20261013_fan_analytics.sql`](./supabase/migrations/20261013_fan_analytics.sql) in the Supabase SQL Editor. The manager page then shows approximate live fan sessions for the current game and unique browsers that opened the season fan link. Unique-browser counts do not identify people, and realtime viewer counts depend on Supabase Realtime being available.
