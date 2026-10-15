import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import QRCode from 'qrcode';   // npm install qrcode

/**
 * StartGame
 *
 * Shown on the Dashboard when a scheduled game is selected.
 * Manager taps "Start Game" → shows QR codes using the game's existing tokens:
 *   📋 Tracker URL  → /track/:token
 *   👀 Fan URL      → /live/:token
 *
 * Props:
 *   game     — game row from Supabase
 *   onStarted — callback after game is started
 *   onClose   — close the panel
 */
export default function StartGame({ game, onStarted, onClose }) {
  const [starting,    setStarting]    = useState(false);
  const [liveGame,    setLiveGame]    = useState(
    // If game already has a token (e.g. was started before), show QRs immediately
    game.tracker_token || game.fan_token ? game : null
  );
  const [trackQR,     setTrackQR]     = useState(null);
  const [fanQR,       setFanQR]       = useState(null);
  const [copied,      setCopied]      = useState(null); // 'track' | 'fan' | null
  const [error,       setError]       = useState(null);

  // Generate QR codes whenever liveGame is set
  useEffect(() => {
    if (!liveGame) return;
    const base = window.location.origin;

    if (liveGame.tracker_token) {
      QRCode.toDataURL(`${base}/track/${liveGame.tracker_token}`, {
        width: 200, margin: 1, color: { dark: '#111', light: '#fff' },
      }).then(setTrackQR);
    }
    if (liveGame.fan_token) {
      QRCode.toDataURL(`${base}/live/${liveGame.fan_token}`, {
        width: 200, margin: 1, color: { dark: '#111', light: '#fff' },
      }).then(setFanQR);
    }
  }, [liveGame]);

  const handleStart = async () => {
    setStarting(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('games')
      .update({
        status:      'live',
        started_at:  new Date().toISOString(),
      })
      .eq('id', game.id)
      .select()
      .single();

    setStarting(false);

    if (err) {
      setError('Failed to start game: ' + err.message);
      return;
    }

    setLiveGame(data);
    onStarted?.(data);
  };

  const copy = async (type) => {
    const base  = window.location.origin;
    const token = type === 'track' ? liveGame.tracker_token : liveGame.fan_token;
    if (!token) return;
    const url   = type === 'track'
      ? `${base}/track/${token}`
      : `${base}/live/${token}`;
    await navigator.clipboard.writeText(url);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const opponentName = game.opponent_name ?? 'Opponent';
  const gameDate     = game.scheduled_at
    ? new Date(game.scheduled_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : 'TBD';

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div>
          <div style={S.title}>vs {opponentName}</div>
          <div style={S.meta}>{gameDate} · {game.is_home ? 'Home' : 'Away'}</div>
        </div>
        <button style={S.closeBtn} onClick={onClose}>✕</button>
      </div>

      {!liveGame ? (
        // ── Pre-start ──
        <div style={S.preStart}>
          <div style={S.gameIcon}>🥍</div>
          <div style={S.preTitle}>Ready to start?</div>
          <div style={S.preSub}>
            Starting the game will generate unique links for your stat trackers and fans.
          </div>
          {error && <div style={S.error}>{error}</div>}
          <button
            style={{ ...S.startBtn, opacity: starting ? .6 : 1 }}
            onClick={handleStart}
            disabled={starting}
          >
            {starting ? 'Starting…' : '▶ Start Game'}
          </button>
        </div>
      ) : (
        // ── Game live — show QR codes ──
        <div style={S.qrPanel}>
          <div style={S.liveTag}>
            <span style={S.liveDot} />
            Game is live
          </div>

          <div style={S.qrGrid}>
            {/* Tracker QR */}
            <div style={S.qrCard}>
              <div style={S.qrLabel}>📋 Stat Trackers</div>
              <div style={S.qrSub}>Share with your stat keepers</div>
              {trackQR
                ? <img src={trackQR} alt="Tracker QR" style={S.qrImg} />
                : <div style={S.qrPlaceholder} />
              }
              <button style={S.copyBtn} onClick={() => copy('track')}>
                {copied === 'track' ? '✓ Copied!' : 'Copy link'}
              </button>
            </div>

            {/* Fan QR */}
            <div style={S.qrCard}>
              <div style={S.qrLabel}>👀 Fans & Parents</div>
              <div style={S.qrSub}>Live stats, read-only</div>
              {fanQR
                ? <img src={fanQR} alt="Fan QR" style={S.qrImg} />
                : <div style={S.qrPlaceholder} />
              }
              <button style={S.copyBtn} onClick={() => copy('fan')}>
                {copied === 'fan' ? '✓ Copied!' : 'Copy link'}
              </button>
            </div>
          </div>

          <div style={S.hint}>
            Show QR codes for people to scan, or copy the link to text/email.
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  wrap: {
    background:   'var(--surf)',
    borderRadius: 16,
    border:       '1px solid var(--bdr)',
    overflow:     'hidden',
    maxWidth:     560,
    width:        '100%',
  },
  header: {
    padding:        '14px 16px',
    display:        'flex',
    alignItems:     'flex-start',
    justifyContent: 'space-between',
    borderBottom:   '1px solid var(--bdr)',
    background:     'var(--ts)',
  },
  title:    { fontSize: 16, fontWeight: 700, color: '#fff' },
  meta:     { fontSize: 12, color: 'rgba(255,255,255,.5)', marginTop: 2 },
  closeBtn: { background: 'none', border: 'none', color: 'rgba(255,255,255,.5)', fontSize: 18, cursor: 'pointer', padding: '0 4px' },

  preStart: { padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' },
  gameIcon: { fontSize: 48 },
  preTitle: { fontSize: 18, fontWeight: 700, color: 'var(--txt)' },
  preSub:   { fontSize: 13, color: 'var(--txt2)', maxWidth: 320, lineHeight: 1.6 },
  error:    { fontSize: 12, color: '#e53e3e', background: 'rgba(229,62,62,.1)', padding: '8px 12px', borderRadius: 8, width: '100%' },
  startBtn: {
    background:   'var(--tp)',
    color:        'var(--tpt)',
    border:       'none',
    borderRadius: 10,
    padding:      '14px 32px',
    fontSize:     15,
    fontWeight:   700,
    cursor:       'pointer',
    marginTop:    8,
  },

  qrPanel: { padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 },
  liveTag: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontSize: 12, fontWeight: 700, color: '#5dbb7a',
    background: 'rgba(93,187,122,.1)', padding: '4px 10px', borderRadius: 20, alignSelf: 'flex-start',
  },
  liveDot: {
    width: 7, height: 7, borderRadius: '50%',
    background: '#5dbb7a', display: 'inline-block',
    animation: 'pulse 1.4s ease-in-out infinite',
  },
  qrGrid:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  qrCard:       { background: 'var(--surf2)', borderRadius: 12, padding: '14px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 },
  qrLabel:      { fontSize: 13, fontWeight: 700, color: 'var(--txt)' },
  qrSub:        { fontSize: 11, color: 'var(--txt2)', textAlign: 'center' },
  qrImg:        { width: 160, height: 160, borderRadius: 8 },
  qrPlaceholder:{ width: 160, height: 160, borderRadius: 8, background: 'var(--surf3)' },
  copyBtn: {
    background:   'var(--tp)',
    color:        'var(--tpt)',
    border:       'none',
    borderRadius: 8,
    padding:      '7px 16px',
    fontSize:     12,
    fontWeight:   700,
    cursor:       'pointer',
    width:        '100%',
    marginTop:    4,
  },
  hint: { fontSize: 11, color: 'var(--txt2)', textAlign: 'center' },
};