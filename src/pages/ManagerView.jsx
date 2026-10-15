import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useManagerView } from '../hooks/useTeam';
import { useFanPresence } from '../hooks/useFanPresence';
import { supabase } from '../lib/supabase';

function fmtShort(dt) {
  if (!dt) return 'Date TBD';
  return new Date(dt).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

// ── Copy button — works even without HTTPS clipboard permission by
// falling back to a temporary selectable input.
function CopyButton({ text, onShowQr }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleCopy = async () => {
    try {
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable.');
        await navigator.clipboard.writeText(text);
      } catch {
        const el = document.createElement('textarea');
        el.value = text;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.select();
        let didCopy = false;
        try {
          didCopy = document.execCommand('copy');
        } finally {
          document.body.removeChild(el);
        }
        if (!didCopy) throw new Error('Clipboard access is unavailable.');
      }
      setError('');
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (copyError) {
      console.error('Unable to copy link from team admin', copyError);
      setError('Copy failed. Select the link above to copy it manually.');
    } finally {
      onShowQr();
    }
  };

  return <>
    <button type="button" style={{ ...M.copyBtn, background: copied ? 'var(--tp)' : 'var(--surf2)', color: copied ? '#fff' : 'var(--txt)' }} onClick={handleCopy}>
      {copied ? '✓ Copied · QR shown' : 'Show QR & copy link'}
    </button>
    {error && <div role="alert" style={M.copyError}>{error}</div>}
  </>;
}

// ── LinkCard — big tap-friendly QR + link block, reused for both the
// team-level fan link and each game's tracker link.
function LinkCard({ label, sub, url, stats }) {
  const [showQr, setShowQr] = useState(false);
  const [dialogCopied, setDialogCopied] = useState(false);

  return (
    <div style={M.linkCard}>
      <div style={M.linkCardHeader}>
        <div style={M.linkLabel}>{label}</div>
        {sub && <div style={M.linkSub}>{sub}</div>}
      </div>
      <div style={M.qrWrap}>
        <QRCodeSVG value={url} size={180} bgColor="#fff" fgColor="#111" />
      </div>
      <div style={M.urlText}>{url}</div>
      {stats && <div style={M.fanStats}>{stats}</div>}
      <CopyButton text={url} onShowQr={() => setShowQr(true)} />
      {showQr && (
        <div style={M.qrOverlay} role="presentation" onClick={() => setShowQr(false)}>
          <section
            style={M.qrDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-qr-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" style={M.qrClose} onClick={() => setShowQr(false)} aria-label="Close QR code">×</button>
            <div id="admin-qr-title" style={M.linkLabel}>{label}</div>
            <div style={M.qrWrap}>
              <QRCodeSVG value={url} size={240} bgColor="#fff" fgColor="#111" />
            </div>
            <div style={M.urlText}>{url}</div>
            <div style={M.qrHint}>Scan to open, or use the button below to copy the link.</div>
            <button type="button" style={M.copyBtn} onClick={async () => {
              try {
                if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable.');
                await navigator.clipboard.writeText(url);
              } catch (copyError) {
                console.error('Unable to copy QR link', copyError);
                const input = document.createElement('textarea');
                input.value = url;
                input.style.position = 'fixed';
                input.style.opacity = '0';
                document.body.appendChild(input);
                input.select();
                let didCopy = false;
                try {
                  didCopy = document.execCommand('copy');
                } finally {
                  document.body.removeChild(input);
                }
                if (!didCopy) {
                  window.prompt('Copy this link:', url);
                }
              }
              setDialogCopied(true);
              window.setTimeout(() => setDialogCopied(false), 1800);
            }}>{dialogCopied ? '✓ Copied' : 'Copy link'}</button>
          </section>
        </div>
      )}
    </div>
  );
}

function GameRow({ game, teamId, baseUrl }) {
  const [open, setOpen] = useState(false);
  const isHome = game.home_team_id === teamId;
  const trackerToken = game.tracker_token;
  const trackerUrl = game.status !== 'scheduled' && trackerToken
    ? `${baseUrl}/track/${trackerToken}`
    : null;

  const badgeStyle = {
    live:      { background: 'rgba(229,62,62,.12)', color: '#e53e3e' },
    final:     { background: 'rgba(26,107,58,.1)',  color: 'var(--tp)' },
    scheduled: { background: 'var(--surf2)',        color: 'var(--txt2)' },
  }[game.status] ?? { background: 'var(--surf2)', color: 'var(--txt2)' };

  return (
    <div style={M.gameRow}>
      <button style={M.gameRowHeader} onClick={() => setOpen(o => !o)}>
        <div style={M.gameInfo}>
          <div style={M.gameName}>
            {isHome ? 'vs' : '@'} {game.opponent_name ?? 'Opponent'}
          </div>
          <div style={M.gameMeta}>{fmtShort(game.scheduled_at)}{game.location ? ` · ${game.location}` : ''}</div>
        </div>
        <div style={{ ...M.statusBadge, ...badgeStyle }}>
          {game.status === 'final' ? `${game.final_score_home}–${game.final_score_away}` : game.status}
        </div>
        <div style={{ ...M.chevron, transform: open ? 'rotate(180deg)' : 'none' }}>⌄</div>
      </button>

      {open && (
        <div style={M.gameRowExpanded}>
          {trackerUrl
            ? <LinkCard label="Tracker QR code" sub="Scan to open this game's stat tracker" url={trackerUrl} />
            : <div style={M.trackerPending}>The tracker QR code will appear here once this game is live.</div>
          }
        </div>
      )}
    </div>
  );
}

export default function ManagerView() {
  const token = window.location.pathname.split('/')[2];
  const { team, games, loading, error } = useManagerView(token);
  const [uniqueFanViews, setUniqueFanViews] = useState(null);
  const activeGame = games.find((game) => game.status === 'live');
  const currentFanViewers = useFanPresence(activeGame?.id, 'manager');

  useEffect(() => {
    if (!team) return;
    let active = true;

    const refreshCount = async () => {
      const { data, error: countError } = await supabase.rpc('get_fan_view_count', {
        p_team_id: team.id,
        p_season_year: team.season_year ?? new Date().getFullYear(),
      });
      if (!active) return;
      if (countError) {
        console.error('Unable to load fan-link visit count', countError);
        return;
      }
      setUniqueFanViews(Number(data));
    };

    refreshCount();
    const intervalId = window.setInterval(refreshCount, 30000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [team]);

  if (loading) return <div style={M.centerScreen}><div style={M.spinner} /></div>;

  if (error || !team) {
    return (
      <div style={M.centerScreen}>
        <div style={{ fontSize: 40 }}>⚠️</div>
        <div style={M.errTitle}>Can't load this page</div>
        <div style={M.errSub}>{error ?? 'Something went wrong.'}</div>
      </div>
    );
  }

  const baseUrl = window.location.origin;
  const fanUrl  = `${baseUrl}/live/${team.slug}`;

  const upcoming = games.filter(g => g.status !== 'final');
  const past     = games.filter(g => g.status === 'final');

  return (
    <div style={M.page}>
      <div style={M.header}>
        {team.logo_url && <img src={team.logo_url} alt="" style={M.logo} />}
        <div>
          <div style={M.teamName}>{team.name}</div>
          <div style={M.teamSub}>Team manager access</div>
        </div>
      </div>

      <div style={M.section}>
        <LinkCard
          label="Season Fan QR Code"
          sub="Fans can scan this to follow the team all season. Copy the link or let them scan the QR."
          url={fanUrl}
          stats={`${currentFanViewers} viewing now · ${uniqueFanViews ?? '—'} unique this season`}
        />
      </div>

      <div style={M.section}>
        <div style={M.sectionTitle}>Schedule</div>
        <div style={M.scheduleHint}>Tap a game to see its tracker QR. Tracker QR codes are available once a game is live.</div>
        {upcoming.length === 0 && past.length === 0 && (
          <div style={M.emptyMsg}>No games scheduled yet.</div>
        )}
        {upcoming.map(g => (
          <GameRow key={g.id} game={g} teamId={team.id} baseUrl={baseUrl} />
        ))}
      </div>

      {past.length > 0 && (
        <div style={M.section}>
          <div style={M.sectionTitle}>Past games</div>
          {past.map(g => (
            <GameRow key={g.id} game={g} teamId={team.id} baseUrl={baseUrl} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Styles — mobile-first: single column, large tap targets, no hover-only affordances ── */
const M = {
  page:   { maxWidth: 480, margin: '0 auto', padding: '20px 16px 40px', display: 'flex', flexDirection: 'column', gap: 20 },
  header: { display: 'flex', alignItems: 'center', gap: 12 },
  logo:   { width: 44, height: 44, borderRadius: 10, objectFit: 'contain', border: '1px solid var(--bdr)' },
  teamName: { fontSize: 19, fontWeight: 800, color: 'var(--txt)' },
  teamSub:  { fontSize: 12, color: 'var(--txt2)', marginTop: 1 },

  section:      { display: 'flex', flexDirection: 'column', gap: 10 },
  sectionTitle: { fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.7px', color: 'var(--txt2)' },
  scheduleHint: { fontSize: 12, color: 'var(--txt2)', lineHeight: 1.4 },
  emptyMsg:     { fontSize: 13, color: 'var(--txt2)', textAlign: 'center', padding: '16px 0' },

  linkCard: {
    background: 'var(--surf)', border: '1px solid var(--bdr)', borderRadius: 14,
    padding: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
  },
  linkCardHeader: { textAlign: 'center' },
  linkLabel: { fontSize: 15, fontWeight: 800, color: 'var(--txt)' },
  linkSub:   { fontSize: 12, color: 'var(--txt2)', marginTop: 2, lineHeight: 1.4 },
  qrWrap:    { padding: 12, background: '#fff', borderRadius: 10 },
  urlText:   { fontSize: 11, color: 'var(--txt2)', wordBreak: 'break-all', textAlign: 'center', fontFamily: 'monospace' },
  fanStats:  { fontSize: 12, color: 'var(--txt2)', fontWeight: 700, textAlign: 'center' },
  copyBtn: {
    border: 'none', borderRadius: 9, padding: '11px 24px', fontSize: 14, fontWeight: 700,
    cursor: 'pointer', width: '100%',
  },
  copyError: { color: 'var(--danger)', fontSize: 12, lineHeight: 1.4, textAlign: 'center' },
  qrOverlay: { position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.68)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  qrDialog: { position: 'relative', width: '100%', maxWidth: 360, maxHeight: '90dvh', overflowY: 'auto', background: 'var(--surf)', color: 'var(--txt)', border: '1px solid var(--bdr)', borderRadius: 16, padding: '28px 20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' },
  qrClose: { position: 'absolute', top: 6, right: 12, border: 0, background: 'none', color: 'var(--txt2)', fontSize: 28, cursor: 'pointer' },
  qrHint: { color: 'var(--txt2)', fontSize: 12, lineHeight: 1.4 },

  gameRow: { background: 'var(--surf)', border: '1px solid var(--bdr)', borderRadius: 12, overflow: 'hidden' },
  gameRowHeader: {
    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
    padding: '13px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
  },
  gameInfo: { flex: 1, minWidth: 0 },
  gameName: { fontSize: 14, fontWeight: 700, color: 'var(--txt)' },
  gameMeta: { fontSize: 12, color: 'var(--txt2)', marginTop: 2 },
  statusBadge: { fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 6, textTransform: 'capitalize', flexShrink: 0 },
  chevron: { fontSize: 16, color: 'var(--txt2)', flexShrink: 0, transition: 'transform .15s' },
  gameRowExpanded: { padding: '0 14px 16px' },
  trackerPending: { padding: '12px 4px 2px', color: 'var(--txt2)', fontSize: 13, textAlign: 'center' },

  centerScreen: {
    height: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: 12, padding: 24, textAlign: 'center',
  },
  spinner: { width: 32, height: 32, border: '3px solid rgba(143,209,79,.3)', borderTop: '3px solid #8fd14f', borderRadius: '50%', animation: 'spin .8s linear infinite' },
  errTitle: { fontSize: 17, fontWeight: 700, color: 'var(--txt)' },
  errSub:   { fontSize: 13, color: 'var(--txt2)', maxWidth: 280 },
};