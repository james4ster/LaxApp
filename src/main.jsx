import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { AuthProvider } from './auth/AuthProvider';

import './styles/globals.css';
import App from './App.jsx';


// Fix mobile browser URL bar eating into viewport height.
function setVh() {
  document.documentElement.style.setProperty(
    '--vh',
    `${window.innerHeight * 0.01}px`
  );
}

setVh();

window.addEventListener('resize', setVh);

window.addEventListener(
  'scroll',
  setVh,
  { passive: true }
);

const fanPathPattern = /^\/live\/[^/]+\/?$/;
const isStandalone =
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

if (fanPathPattern.test(window.location.pathname)) {
  try {
    localStorage.setItem('laxtrack_home_fan_path', window.location.pathname);
  } catch (error) {
    console.error('Unable to save the season fan link for the home-screen app', error);
  }
} else if (isStandalone && window.location.pathname === '/') {
  try {
    const fanPath = localStorage.getItem('laxtrack_home_fan_path');
    if (fanPath && fanPathPattern.test(fanPath)) {
      window.history.replaceState(null, '', fanPath);
    }
  } catch (error) {
    console.error('Unable to restore the season fan link in the home-screen app', error);
  }
}

const path = window.location.pathname;

const isPublicRoute =
path.startsWith('/track/') ||
path.startsWith('/live/') ||
path.startsWith('/manage/');


// Public games do NOT need authentication
if (isPublicRoute) {

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>
  );

} else {

  // Coach portal DOES require authentication
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </StrictMode>
  );

}