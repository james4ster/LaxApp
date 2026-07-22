import React, { useEffect, useState } from 'react';

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    try { return localStorage.getItem('install_dismissed') === 'true'; }
    catch { return false; }
  });

  useEffect(() => {
    // Already installed as PWA — don't show
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (isDismissed) return;

    // iOS doesn't fire beforeinstallprompt — show manual instructions instead
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(ios);
    if (ios) { setShow(true); return; }

    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [isDismissed]);

  const handleInstall = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setShow(false);
  };

  const handleDismiss = () => {
    setShow(false);
    try { localStorage.setItem('install_dismissed', 'true'); }
    catch { /* non-fatal */ }
  };

  if (!show) return null;

  return (
    <div style={styles.banner}>
      <div style={styles.text}>
        {isIOS
          ? <>Install LaxTrack: tap <strong>Share</strong> → <strong>Add to Home Screen</strong> for the best experience.</>
          : <>Add LaxTrack to your home screen for fullscreen sideline tracking.</>
        }
      </div>
      <div style={styles.actions}>
        {!isIOS && (
          <button style={styles.installBtn} onClick={handleInstall}>
            Install
          </button>
        )}
        <button style={styles.dismissBtn} onClick={handleDismiss}>
          ✕
        </button>
      </div>
    </div>
  );
}

const styles = {
  banner: {
    position:       'fixed',
    bottom:         0,
    left:           0,
    right:          0,
    zIndex:         200,
    background:     'var(--ts)',
    borderTop:      '1px solid rgba(255,255,255,.1)',
    padding:        '10px 12px',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    gap:            10,
    maxWidth:       480,
    margin:         '0 auto',
  },
  text: {
    fontSize:   12,
    color:      'rgba(255,255,255,.75)',
    flex:       1,
    lineHeight: 1.4,
  },
  actions: { display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 },
  installBtn: {
    background:   'var(--ta)',
    color:        'var(--tat)',
    border:       'none',
    borderRadius: 7,
    padding:      '6px 12px',
    fontSize:     12,
    fontWeight:   700,
    cursor:       'pointer',
  },
  dismissBtn: {
    background: 'none',
    border:     'none',
    color:      'rgba(255,255,255,.4)',
    fontSize:   14,
    cursor:     'pointer',
    padding:    '4px 6px',
  },
};