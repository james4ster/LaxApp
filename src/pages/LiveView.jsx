import React, { useState } from 'react';
import PlayerStatsTable from '../components/PlayerStatsTable';

function fmtMs(ms) {
  const t = Math.floor(ms / 1000);
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function LiveView({
  scoreUs,
  scoreThem,
  quarter,
  counts,
  gc,
  sogUs,
  svPct,
  usMs,
  themMs,
  possState,
  fieldPlayers,
  goalies,
  playerStats,
  activeGoalie,
  saves,
  ga,
}) {
  const [tab, setTab] = useState('team');

  return (
    <div style={styles.outer}>
      {/* Top — scoreboard + tabs (sticky) */}
      <div style={styles.top}>
        {/* Scoreboard card */}
        <div style={styles.card}>
          <div style={styles.scoreRow}>
            <div style={styles.team}>
              <div style={styles.teamName}>Us</div>
              <div style={{ ...styles.score, color: 'var(--ta)' }}>
                {scoreUs}
              </div>
            </div>
            <div style={styles.mid}>
              <div style={styles.vs}>vs</div>
              <div style={styles.pips}>
                {[1, 2, 3, 4].map((q) => (
                  <div
                    key={q}
                    style={{
                      ...styles.pip,
                      background:
                        q < quarter
                          ? 'var(--ta)'
                          : q === quarter
                          ? '#ff3f3f'
                          : 'rgba(255,255,255,.15)',
                      animation: q === quarter ? 'blink 1.4s infinite' : 'none',
                    }}
                  />
                ))}
              </div>
            </div>
            <div style={styles.team}>
              <div style={styles.teamName}>Opponent</div>
              <div style={{ ...styles.score, color: '#fff' }}>{scoreThem}</div>
            </div>
          </div>

          {/* Possession row */}
          <div style={styles.possRow}>
            <div
              style={{ ...styles.possItem, background: 'rgba(143,209,79,.15)' }}
            >
              <div style={styles.possLbl}>Us Poss</div>
              <div style={{ ...styles.possVal, color: 'var(--ta)' }}>
                {fmtMs(usMs)}
              </div>
            </div>
            <div
              style={{
                ...styles.possItem,
                background: 'rgba(255,255,255,.06)',
              }}
            >
              <div style={styles.possLbl}>Quarter</div>
              <div
                style={{ ...styles.possVal, color: 'rgba(255,255,255,.65)' }}
              >
                Q{quarter}
              </div>
            </div>
            <div
              style={{ ...styles.possItem, background: 'rgba(255,100,100,.1)' }}
            >
              <div style={styles.possLbl}>Opp Poss</div>
              <div style={{ ...styles.possVal, color: '#ff8080' }}>
                {fmtMs(themMs)}
              </div>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div style={styles.tabs}>
          {['team', 'players'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                ...styles.tab,
                background: tab === t ? 'var(--surf)' : 'none',
                color: tab === t ? 'var(--txt)' : 'var(--txt2)',
                boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,.1)' : 'none',
              }}
            >
              {t === 'team' ? 'Team Stats' : 'Player Stats'}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable stats area */}
      <div style={styles.scroll} className="scroll-y">
        {tab === 'team' && (
          <TeamStatsTable
            counts={counts}
            gc={gc}
            sogUs={sogUs}
            svPct={svPct}
            scoreUs={scoreUs}
            scoreThem={scoreThem}
          />
        )}
        {tab === 'players' && (
          <PlayerStatsTable
            fieldPlayers={fieldPlayers}
            goalies={goalies}
            playerStats={playerStats}
            activeGoalie={activeGoalie}
            saves={saves}
            ga={ga}
            svPct={svPct}
          />
        )}
      </div>
    </div>
  );
}

// ── Team Stats Table ──────────────────────────────────────────────────────────
function TeamStatsTable({ gc, sogUs, svPct, scoreUs, scoreThem }) {
  const rows = [
    { label: 'Goals', us: scoreUs, them: scoreThem },
    { label: 'Shots on goal', us: sogUs(), them: gc('oshot') },
    { label: 'Shots missed', us: gc('miss'), them: '–' },
    { label: 'Ground balls', us: gc('gb'), them: '–' },
    { label: 'Turnovers', us: gc('to'), them: '–' },
    { label: 'Caused TOs', us: gc('cto'), them: '–' },
    {
      label: 'Faceoffs',
      us: `${gc('fo_w')}–${gc('fo_l')}`,
      them: `${gc('fo_l')}–${gc('fo_w')}`,
    },
    { label: 'Save %', us: svPct(), them: '–' },
  ];

  return (
    <div style={tblStyle.tbl}>
      <div
        style={{
          ...tblStyle.row,
          ...tblStyle.hdr,
          gridTemplateColumns: '1fr 40px 40px',
        }}
      >
        <div style={tblStyle.hdrCell}>Stat</div>
        <div style={{ ...tblStyle.hdrCell, textAlign: 'center' }}>Us</div>
        <div style={{ ...tblStyle.hdrCell, textAlign: 'center' }}>Opp</div>
      </div>
      {rows.map((r) => (
        <div
          key={r.label}
          style={{ ...tblStyle.row, gridTemplateColumns: '1fr 40px 40px' }}
        >
          <div style={tblStyle.lbl}>{r.label}</div>
          <div style={{ ...tblStyle.val, color: 'var(--tp)' }}>{r.us}</div>
          <div style={{ ...tblStyle.val, color: 'var(--txt2)' }}>{r.them}</div>
        </div>
      ))}
    </div>
  );
}

const tblStyle = {
  tbl: {
    background: 'var(--surf)',
    borderRadius: 11,
    overflow: 'hidden',
    border: '1px solid var(--bdr)',
    marginBottom: 9,
  },
  row: {
    display: 'grid',
    padding: '7px 10px',
    borderTop: '1px solid var(--bdr)',
    alignItems: 'center',
  },
  hdr: { background: 'var(--surf2)' },
  hdrCell: {
    fontSize: 9,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '.7px',
    color: 'var(--txt2)',
  },
  lbl: { fontSize: 12, color: 'var(--txt)' },
  val: { fontSize: 13, fontWeight: 700, textAlign: 'center' },
};

const styles = {
  outer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minHeight: 0,
  },
  top: { padding: '8px 9px 0', flexShrink: 0 },
  card: {
    background: 'var(--ts)',
    borderRadius: 13,
    padding: '11px 14px 10px',
    marginBottom: 8,
  },
  scoreRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  team: { flex: 1, textAlign: 'center' },
  teamName: {
    fontSize: 9,
    color: 'rgba(255,255,255,.4)',
    textTransform: 'uppercase',
    letterSpacing: '.8px',
    marginBottom: 2,
  },
  score: {
    fontSize: 44,
    fontWeight: 800,
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
  },
  mid: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  vs: { fontSize: 12, color: 'rgba(255,255,255,.2)' },
  pips: { display: 'flex', gap: 3 },
  pip: { width: 7, height: 7, borderRadius: 2 },
  possRow: { display: 'flex', gap: 5, marginTop: 9 },
  possItem: {
    flex: 1,
    borderRadius: 8,
    padding: '5px 7px',
    textAlign: 'center',
  },
  possLbl: {
    fontSize: 8,
    fontWeight: 700,
    color: 'rgba(255,255,255,.4)',
    textTransform: 'uppercase',
    letterSpacing: '.5px',
  },
  possVal: {
    fontSize: 15,
    fontWeight: 800,
    fontVariantNumeric: 'tabular-nums',
  },
  tabs: {
    display: 'flex',
    background: 'var(--surf2)',
    borderRadius: 9,
    padding: 3,
    marginBottom: 0,
  },
  tab: {
    flex: 1,
    padding: '6px 4px',
    border: 'none',
    borderRadius: 7,
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all .12s',
  },
  scroll: {
    flex: 1,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    padding: '8px 9px 8px',
  },
};
