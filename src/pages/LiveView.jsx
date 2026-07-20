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
  quarterStats = {},   // { '1': { goal, ogoal, sog, oshot }, ... }
  gameEnded = false,
}) {
  const [tab, setTab] = useState('team');

  return (
    <div style={S.outer}>

      {/* ── Fixed top ── */}
      <div style={S.top}>

        {/* Scoreboard */}
        <Scoreboard
          scoreUs={scoreUs}
          scoreThem={scoreThem}
          quarter={quarter}
          usMs={usMs}
          themMs={themMs}
          gameEnded={gameEnded}
        />

        {/* Quarter breakdown — only renders once Q1 has data */}
        <QuarterBreakdown quarterStats={quarterStats} currentQuarter={quarter} />

        {/* Tab switcher */}
        <div style={S.tabs}>
          {['team', 'players'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                ...S.tab,
                background: tab === t ? 'var(--surf)' : 'none',
                color:      tab === t ? 'var(--txt)'  : 'var(--txt2)',
                boxShadow:  tab === t ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
              }}
            >
              {t === 'team' ? 'Team Stats' : 'Player Stats'}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable area */}
      <div style={S.scroll} className="scroll-y">
        {tab === 'team' && (
          <TeamStatsTable
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

// ── Scoreboard ────────────────────────────────────────────────────────────────
// Clean single score display — no duplicate number in top-left.
// Period pips + possession times live inside the card.
function Scoreboard({ scoreUs, scoreThem, quarter, usMs, themMs, gameEnded }) {
  return (
    <div style={SB.card}>

      {/* Status pill */}
      <div style={SB.statusRow}>
        {gameEnded ? (
          <div style={{ ...SB.pill, background: 'rgba(255,255,255,.12)', color: 'rgba(255,255,255,.6)' }}>
            FINAL
          </div>
        ) : (
          <div style={{ ...SB.pill, background: 'rgba(255,63,63,.18)', color: '#ff8080' }}>
            <span style={SB.liveDot} /> LIVE · Q{quarter}
          </div>
        )}
        {/* Quarter pips */}
        <div style={SB.pips}>
          {[1,2,3,4].map(q => (
            <div key={q} style={{
              ...SB.pip,
              background: q < quarter  ? 'var(--ta)'
                         : q === quarter && !gameEnded ? '#ff3f3f'
                         : q <= quarter  ? 'var(--ta)'
                         : 'rgba(255,255,255,.15)',
            }} />
          ))}
        </div>
      </div>

      {/* Score row */}
      <div style={SB.scoreRow}>
        <div style={SB.teamBlock}>
          <div style={SB.teamName}>US</div>
          <div style={{ ...SB.score, color: 'var(--ta)' }}>{scoreUs}</div>
        </div>

        <div style={SB.dash}>–</div>

        <div style={SB.teamBlock}>
          <div style={SB.teamName}>OPP</div>
          <div style={{ ...SB.score, color: '#fff' }}>{scoreThem}</div>
        </div>
      </div>

      {/* Possession row */}
      <div style={SB.possRow}>
        <div style={{ ...SB.possItem, background: 'rgba(143,209,79,.13)' }}>
          <div style={SB.possLbl}>Us Poss</div>
          <div style={{ ...SB.possVal, color: 'var(--ta)' }}>{fmtMs(usMs)}</div>
        </div>
        <div style={{ ...SB.possItem, background: 'rgba(255,100,100,.1)' }}>
          <div style={SB.possLbl}>Opp Poss</div>
          <div style={{ ...SB.possVal, color: '#ff8080' }}>{fmtMs(themMs)}</div>
        </div>
      </div>

    </div>
  );
}

const SB = {
  card: {
    background:   'var(--ts)',
    borderRadius: 14,
    padding:      '10px 14px 12px',
    marginBottom: 7,
  },
  statusRow: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   8,
  },
  pill: {
    display:       'inline-flex',
    alignItems:    'center',
    gap:           5,
    fontSize:      10,
    fontWeight:    700,
    letterSpacing: '.5px',
    padding:       '3px 8px',
    borderRadius:  20,
  },
  liveDot: {
    display:      'inline-block',
    width:        5, height: 5,
    borderRadius: '50%',
    background:   '#ff3f3f',
    animation:    'blink 1.4s ease-in-out infinite',
    flexShrink:   0,
  },
  pips: { display: 'flex', gap: 4 },
  pip:  { width: 8, height: 8, borderRadius: 2 },
  scoreRow: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            20,
    marginBottom:   10,
  },
  teamBlock: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 },
  teamName:  { fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.4)', letterSpacing: '.8px', textTransform: 'uppercase' },
  score:     { fontSize: 52, fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums' },
  dash:      { fontSize: 28, color: 'rgba(255,255,255,.2)', fontWeight: 200, paddingBottom: 4 },
  possRow:   { display: 'flex', gap: 6 },
  possItem:  { flex: 1, borderRadius: 8, padding: '5px 8px', textAlign: 'center' },
  possLbl:   { fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.5px' },
  possVal:   { fontSize: 15, fontWeight: 800, fontVariantNumeric: 'tabular-nums' },
};

// ── Quarter Breakdown Panel ───────────────────────────────────────────────────
function QuarterBreakdown({ quarterStats, currentQuarter }) {
  const quarters = [1,2,3,4].filter(q => q <= currentQuarter);

  // Don't render until there's at least one event in Q1
  const hasAnyData = quarters.some(q => {
    const b = quarterStats[String(q)];
    return b && (b.goal > 0 || b.ogoal > 0 || b.sog > 0 || b.oshot > 0);
  });
  if (!hasAnyData) return null;

  const qc = (q, key) => quarterStats[String(q)]?.[key] ?? 0;

  return (
    <div style={QB.panel}>

      {/* Column headers */}
      <div style={QB.headerRow}>
        <div style={{ ...QB.cell, ...QB.labelHdr }}></div>
        {quarters.map(q => (
          <div key={q} style={{
            ...QB.cell, ...QB.qHdr,
            color: q === currentQuarter ? 'var(--ta)' : 'rgba(255,255,255,.45)',
          }}>
            Q{q}
          </div>
        ))}
      </div>

      {/* Us Goals */}
      <div style={QB.row}>
        <div style={{ ...QB.cell, ...QB.rowLabel }}>
          <span style={{ ...QB.dot, background: 'var(--ta)' }} />
          Goals
        </div>
        {quarters.map(q => {
          const v = qc(q, 'goal');
          return (
            <div key={q} style={{ ...QB.cell, ...QB.dataVal, color: v > 0 ? 'var(--ta)' : 'rgba(255,255,255,.3)', fontWeight: v > 0 ? 800 : 400 }}>
              {v}
            </div>
          );
        })}
      </div>

      {/* Us SOG */}
      <div style={QB.row}>
        <div style={{ ...QB.cell, ...QB.rowLabel }}>
          <span style={{ ...QB.dot, background: 'var(--ta)', opacity: .45 }} />
          SOG
        </div>
        {quarters.map(q => (
          <div key={q} style={{ ...QB.cell, ...QB.dataVal, color: 'rgba(255,255,255,.5)' }}>
            {qc(q, 'sog')}
          </div>
        ))}
      </div>

      <div style={QB.divider} />

      {/* Opp Goals */}
      <div style={QB.row}>
        <div style={{ ...QB.cell, ...QB.rowLabel }}>
          <span style={{ ...QB.dot, background: '#e53e3e' }} />
          Goals
        </div>
        {quarters.map(q => {
          const v = qc(q, 'ogoal');
          return (
            <div key={q} style={{ ...QB.cell, ...QB.dataVal, color: v > 0 ? '#ff8080' : 'rgba(255,255,255,.3)', fontWeight: v > 0 ? 800 : 400 }}>
              {v}
            </div>
          );
        })}
      </div>

      {/* Opp SOG */}
      <div style={QB.row}>
        <div style={{ ...QB.cell, ...QB.rowLabel }}>
          <span style={{ ...QB.dot, background: '#e53e3e', opacity: .45 }} />
          SOG
        </div>
        {quarters.map(q => (
          <div key={q} style={{ ...QB.cell, ...QB.dataVal, color: 'rgba(255,255,255,.38)' }}>
            {qc(q, 'oshot')}
          </div>
        ))}
      </div>

    </div>
  );
}

const QB = {
  panel: {
    background:   'var(--ts)',
    borderRadius: 11,
    border:       '1px solid rgba(255,255,255,.07)',
    overflow:     'hidden',
    marginBottom: 7,
  },
  headerRow: {
    display:     'flex',
    alignItems:  'center',
    padding:     '5px 10px 3px',
    background:  'rgba(0,0,0,.2)',
    borderBottom:'1px solid rgba(255,255,255,.06)',
  },
  row: {
    display:    'flex',
    alignItems: 'center',
    padding:    '4px 10px',
  },
  cell:      { flex: 1, textAlign: 'center' },
  labelHdr:  { flex: 2, textAlign: 'left', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', color: 'rgba(255,255,255,.25)' },
  qHdr:      { fontSize: 10, fontWeight: 800, letterSpacing: '.3px' },
  rowLabel:  { flex: 2, textAlign: 'left', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,.5)', display: 'flex', alignItems: 'center', gap: 6 },
  dataVal:   { fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums' },
  dot:       { display: 'inline-block', width: 6, height: 6, borderRadius: '50%', flexShrink: 0 },
  divider:   { height: 1, background: 'rgba(255,255,255,.06)', margin: '1px 10px' },
};

// ── Team Stats Table ──────────────────────────────────────────────────────────
function TeamStatsTable({ gc, sogUs, svPct, scoreUs, scoreThem }) {
  const rows = [
    { label: 'Goals',         us: scoreUs,                        them: scoreThem },
    { label: 'Shots on goal', us: sogUs(),                        them: gc('oshot') },
    { label: 'Shots missed',  us: gc('miss'),                     them: '–' },
    { label: 'Ground balls',  us: gc('gb'),                       them: gc('gbt') || '–' },  // ← gbt added
    { label: 'Turnovers',     us: gc('to'),                       them: '–' },
    { label: 'Caused TOs',    us: gc('cto'),                      them: '–' },
    { label: 'Faceoffs',      us: `${gc('fo_w')}–${gc('fo_l')}`, them: `${gc('fo_l')}–${gc('fo_w')}` },
    { label: 'Save %',        us: typeof svPct === 'function' ? svPct() : svPct, them: '–' },
  ];

  return (
    <div style={T.tbl}>
      <div style={{ ...T.row, ...T.hdr, gridTemplateColumns: '1fr 44px 44px' }}>
        <div style={T.hdrCell}>Stat</div>
        <div style={{ ...T.hdrCell, textAlign: 'center' }}>Us</div>
        <div style={{ ...T.hdrCell, textAlign: 'center' }}>Opp</div>
      </div>
      {rows.map((r) => (
        <div key={r.label} style={{ ...T.row, gridTemplateColumns: '1fr 44px 44px' }}>
          <div style={T.lbl}>{r.label}</div>
          <div style={{ ...T.val, color: 'var(--tp)' }}>{r.us}</div>
          <div style={{ ...T.val, color: 'var(--txt2)' }}>{r.them}</div>
        </div>
      ))}
    </div>
  );
}

const T = {
  tbl:     { background: 'var(--surf)', borderRadius: 11, overflow: 'hidden', border: '1px solid var(--bdr)', marginBottom: 9 },
  row:     { display: 'grid', padding: '8px 12px', borderTop: '1px solid var(--bdr)', alignItems: 'center' },
  hdr:     { background: 'var(--surf2)' },
  hdrCell: { fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.7px', color: 'var(--txt2)' },
  lbl:     { fontSize: 13, color: 'var(--txt)' },
  val:     { fontSize: 14, fontWeight: 700, textAlign: 'center' },
};

// ── PlayerStatsTable wrapper — just fixes the sort direction ─────────────────
// The real table is in PlayerStatsTable.jsx — this note is here so you know
// where the sort fix lives. See PlayerStatsTable.jsx patch.

const S = {
  outer:  { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 },
  top:    { padding: '8px 9px 0', flexShrink: 0 },
  tabs:   { display: 'flex', background: 'var(--surf2)', borderRadius: 9, padding: 3, marginBottom: 0 },
  tab:    { flex: 1, padding: '6px 4px', border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all .12s' },
  scroll: { flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '8px 9px 8px' },
};