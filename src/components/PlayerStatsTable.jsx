import React, { useState } from 'react';
import { FIELD_COLS, GOALIE_COLS } from '../lib/constants';

export default function PlayerStatsTable({
  fieldPlayers,
  goalies,
  playerStats,
  activeGoalie,
  saves,
  ga,
  svPct,
}) {
  const [sortCol, setSortCol] = useState('pts');
  const [sortDir, setSortDir] = useState(-1); // -1 = desc

  const handleSort = (key) => {
    if (sortCol === key) setSortDir((d) => d * -1);
    else {
      setSortCol(key);
      setSortDir(-1);
    }
  };

  // Build sortable rows
  const rows = fieldPlayers
    .map((p) => {
      const ps = playerStats[p.id] ?? {};
      const pts = (ps.g ?? 0) + (ps.a ?? 0);
      return {
        ...p,
        g: ps.g ?? 0,
        a: ps.a ?? 0,
        pts,
        gb: ps.gb ?? 0,
        to: ps.to ?? 0,
        fo_w: ps.fo_w ?? 0,
        fo_l: ps.fo_l ?? 0,
      };
    })
    .sort((a, b) => {
      if (sortCol === 'name')
        return sortDir * (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
      if (sortCol === 'num') return sortDir * (a.num - b.num);
      if (sortCol === 'fo') return sortDir * (b.fo_w - a.fo_w);
      return sortDir * (b[sortCol] - a[sortCol]);
    });

  const fTemplate = FIELD_COLS.map((c) => c.width).join(' ');
  const gTemplate = GOALIE_COLS.map((c) => c.width).join(' ');

  return (
    <div style={styles.tbl}>
      {/* ── Field Players ── */}
      <div className="tbl-section-lbl" style={{ borderTop: 'none' }}>
        Field Players
      </div>

      {/* Header */}
      <div
        style={{ ...styles.row, ...styles.hdr, gridTemplateColumns: fTemplate }}
      >
        {FIELD_COLS.map((c) => {
          const sk = c.key === 'fo' ? 'fo' : c.key;
          const isActive = sortCol === sk;
          return (
            <div
              key={c.key}
              onClick={() => handleSort(sk)}
              style={{
                ...styles.hdrCell,
                textAlign: c.align,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent:
                  c.align === 'center'
                    ? 'center'
                    : c.align === 'right'
                    ? 'flex-end'
                    : 'flex-start',
                gap: 2,
                color: isActive ? 'var(--tp)' : 'var(--txt2)',
              }}
            >
              {c.label}
              <span style={{ fontSize: 7, opacity: isActive ? 1 : 0.35 }}>
                {isActive ? (sortDir === -1 ? '▼' : '▲') : '⇅'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Data rows */}
      {rows.map((r) => (
        <div
          key={r.id}
          style={{ ...styles.row, gridTemplateColumns: fTemplate }}
        >
          <div style={styles.pNum}>{r.num}</div>
          <div style={styles.pName}>
            {r.name}
            {r.pos === 'FOGO' && <span style={styles.fogoTag}>FOGO</span>}
          </div>
          <div
            style={{
              ...styles.val,
              color: r.g > 0 ? 'var(--tp)' : 'var(--txt)',
            }}
          >
            {r.g}
          </div>
          <div
            style={{
              ...styles.val,
              color: r.a > 0 ? 'var(--tp)' : 'var(--txt)',
            }}
          >
            {r.a}
          </div>
          <div
            style={{
              ...styles.val,
              fontWeight: 800,
              color: r.pts > 0 ? 'var(--tp)' : 'var(--txt)',
            }}
          >
            {r.pts}
          </div>
          <div style={styles.val}>{r.gb}</div>
          <div style={styles.val}>{r.to}</div>
          <div style={{ ...styles.val, fontSize: 10 }}>
            {r.fo_w}-{r.fo_l}
          </div>
        </div>
      ))}

      {/* ── Goalies ── */}
      <div className="tbl-section-lbl">Goalies</div>

      <div
        style={{ ...styles.row, ...styles.hdr, gridTemplateColumns: gTemplate }}
      >
        {GOALIE_COLS.map((c) => (
          <div key={c.key} style={{ ...styles.hdrCell, textAlign: c.align }}>
            {c.label}
          </div>
        ))}
      </div>

      {goalies.map((g) => {
        const isActive = g.id === activeGoalie?.id;
        const sv = isActive ? saves : 0;
        const gag = isActive ? ga : 0;
        const svp = isActive ? svPct : '–';
        return (
          <div
            key={g.id}
            style={{ ...styles.row, gridTemplateColumns: gTemplate }}
          >
            <div style={styles.pNum}>{g.num}</div>
            <div style={styles.pName}>
              {g.name}
              {isActive && <span style={styles.inTag}>IN</span>}
            </div>
            <div style={styles.val}>{sv}</div>
            <div style={styles.val}>{gag}</div>
            <div style={{ ...styles.val, color: 'var(--tp)', fontWeight: 800 }}>
              {svp}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  tbl: {
    background: 'var(--surf)',
    borderRadius: 11,
    overflow: 'hidden',
    border: '1px solid var(--bdr)',
    marginBottom: 9,
  },
  row: {
    display: 'grid',
    padding: '5px 9px',
    borderTop: '1px solid var(--bdr)',
    alignItems: 'center',
    gap: 0,
  },
  hdr: { background: 'var(--surf2)', cursor: 'default' },
  hdrCell: {
    fontSize: 9,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '.7px',
    color: 'var(--txt2)',
  },
  pNum: {
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--txt2)',
    textAlign: 'right',
    paddingRight: 3,
  },
  pName: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--txt)',
    paddingLeft: 5,
    display: 'flex',
    alignItems: 'center',
    gap: 2,
  },
  val: {
    fontSize: 12,
    fontWeight: 700,
    textAlign: 'center',
    color: 'var(--txt)',
  },
  fogoTag: {
    fontSize: 7,
    fontWeight: 700,
    color: 'var(--ta)',
    textTransform: 'uppercase',
    marginLeft: 3,
  },
  inTag: { fontSize: 7, fontWeight: 700, color: 'var(--ta)', marginLeft: 3 },
};
