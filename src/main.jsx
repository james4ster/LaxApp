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


const path = window.location.pathname;

const isPublicRoute =
  path.startsWith('/track/') ||
  path.startsWith('/live/');


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