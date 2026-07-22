import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Fix mobile browser URL bar eating into viewport height.
// Sets --vh to 1% of the actual visible window height, updated on resize.
function setVh() {
  document.documentElement.style.setProperty(
    '--vh', `${window.innerHeight * 0.01}px`
  );
}
setVh();
window.addEventListener('resize', setVh);
// Also update on scroll since URL bar show/hide triggers no resize event on iOS
window.addEventListener('scroll', setVh, { passive: true });

import './styles/globals.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
