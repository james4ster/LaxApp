import React, { useState } from 'react';
import { FIELD_COLS, GOALIE_COLS } from '../lib/constants';

export default function PlayerStatsTable({
  fieldPlayers,
  goalies,
  playerStats,
}) {
  const [sortCol, setSortCol] = useState('pts');
  const [sortDir, setSortDir] = useState(-1); // -1 = desc, 1 = asc

  const handleSort = (key) => {
    if (sortCol === key) {
      setSortDir((d) => d * -1);
    } else {
      setSortCol(key);
      setSortDir(-1); // always start descending on new column
    }
  };

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
        sog: ps.sog ?? 0,
        to: ps.to ?? 0,
        fo_w: ps.fo_w ?? 0,
        fo_l: ps.fo_l ?? 0,
      };
    })
    .sort((a, b) => {
      // sortDir: -1 = descending (higher values first)
      //          +1 = ascending  (lower values first)
      if (sortCol === 'name')
        return sortDir * (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
      if (sortCol === 'num')
        return sortDir * (a.num - b.num);
      if (sortCol === 'fo')
        // descending means more FO wins at top
        return sortDir === -1 ? b.fo_w - a.fo_w : a.fo_w - b.fo_w;
      // numeric columns: descending = b - a, ascending = a - b
      return sortDir === -1
        ? (b[sortCol] ?? 0) - (a[sortCol] ?? 0)
        : (a[sortCol] ?? 0) - (b[sortCol] ?? 0);
    });

  const fTemplate = FIELD_COLS.map((c) => c.width).join(' ');
  const gTemplate = GOALIE_COLS.map((c) => c.width).join(' ');

  const SortIcon = ({ colKey }) => {
    const sk = colKey === 'fo' ? 'fo' : colKey;
    const isActive = sortCol === sk;
    // ▼ = descending (high→low), ▲ = ascending (low→high)
    const arrow = isActive ? (sortDir === -1 ? '▼' : '▲') : '⇅';
    return (
      <span style={{
        fontSize: 7,
        opacity: isActive ? 1 : 0.3,
        color: isActive ? 'var(--tp)' : 'inherit',
        marginLeft: 2,
      }}>
        {arrow}
      </span>
    );
  };

  return (
    <div style={S.tbl}>

      {/* ── Field Players ─────────────────────────────────── */}
      <div className="tbl-section-lbl" style={{ borderTop: 'none' }}>
        Field Players
      </div>

      {/* Header */}
      <div style={{ ...S.row, ...S.hdr, gridTemplateColumns: fTemplate }}>
        {FIELD_COLS.map((c) => {
          const sk = c.key === 'fo' ? 'fo' : c.key;
          const isActive = sortCol === sk;
          return (
            <div
              key={c.key}
              onClick={() => handleSort(sk)}
              style={{
                ...S.hdrCell,
                textAlign: c.align,
                color: isActive ? 'var(--tp)' : 'var(--txt2)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent:
                  c.align === 'center' ? 'center'
                  : c.align === 'right' ? 'flex-end'
                  : 'flex-start',
                gap: 1,
              }}
            >
              {c.label}
              <SortIcon colKey={c.key} />
            </div>
          );
        })}
      </div>

      {/* Data rows */}
      {rows.map((r) => (
        <div key={r.id} style={{ ...S.row, gridTemplateColumns: fTemplate }}>
          <div style={S.pNum}>{r.num}</div>
          <div style={S.pName}>
            {r.name}
            {r.pos === 'FOGO' && <span style={S.fogoTag}>FOGO</span>}
          </div>
          <div style={{ ...S.val, color: r.g > 0 ? 'var(--tp)' : 'var(--txt2)', fontWeight: r.g > 0 ? 800 : 400 }}>
            {r.g}
          </div>
          <div style={{ ...S.val, color: r.a > 0 ? 'var(--tp)' : 'var(--txt2)', fontWeight: r.a > 0 ? 800 : 400 }}>
            {r.a}
          </div>
          <div style={{ ...S.val, color: r.pts > 0 ? 'var(--tp)' : 'var(--txt2)', fontWeight: r.pts > 0 ? 800 : 400 }}>
            {r.pts}
          </div>
          <div style={{ ...S.val, color: r.gb > 0 ? 'var(--txt)' : 'var(--txt2)' }}>
            {r.gb}
          </div>
          <div style={{ 
            ...S.val, 
            color: r.sog > 0 ? 'var(--txt)' : 'var(--txt2)',
            fontWeight: r.sog > 0 ? 700 : 400
          }}>
            {r.sog}
          </div>
          <div style={{ ...S.val, color: r.to > 0 ? 'var(--danger)' : 'var(--txt2)' }}>
            {r.to}
          </div>
          <div style={{ ...S.val, fontSize: 10, color: 'var(--txt2)' }}>
            {r.fo_w}-{r.fo_l}
          </div>
        </div>
      ))}

      {/* ── Goalies ───────────────────────────────────────── */}
      <div className="tbl-section-lbl">Goalies</div>

      <div style={{ ...S.row, ...S.hdr, gridTemplateColumns: gTemplate }}>
        {GOALIE_COLS.map((c) => (
          <div
          key={c.key}
          style={{
            ...S.hdrCell,
            textAlign: c.align,
            display: 'flex',
            justifyContent:
              c.align === 'center'
                ? 'center'
                : c.align === 'right'
                ? 'flex-end'
                : 'flex-start',
          }}
        >
          {c.label}
        </div>
        ))}
      </div>

      {goalies.map((g) => {
        const gs = playerStats[g.id] ?? {};

        const gag = gs.ga ?? 0;
        const shots = gs.shots ?? 0;
        const sv = Math.max(0, shots - gag);

        const svp = shots > 0
          ? `${Math.round((sv / shots) * 100)}%`
          : '–';

        return (
          <div key={g.id} style={{ ...S.row, gridTemplateColumns: gTemplate }}>
            <div style={S.pNum}>{g.num}</div>
            <div style={S.pName}>
              {g.name}
              { /* This shows the In next to active goalie, removing */ } 
             { /*  {isActive && <span style={S.inTag}>IN</span>} */ }
            </div>
              <div style={{ ...S.val, textAlign:'center' }}>{shots}</div>
              <div style={{ ...S.val, textAlign:'center' }}>{sv}</div>
              <div style={{ ...S.val, textAlign:'center' }}>{gag}</div>
              <div style={{ ...S.val, textAlign:'center', color:'var(--tp)', fontWeight:800 }}>
                {svp}
              </div>
          </div>
        );
      })}
    </div>
  );
}

const S = {
  tbl: {
    background: 'var(--surf)',
    borderRadius: 11,
    overflow: 'hidden',
    border: '1px solid var(--bdr)',
    marginBottom: 9,
  },
  row: {
    display: 'grid',
    padding: '6px 10px',
    borderTop: '1px solid var(--bdr)',
    alignItems: 'center',
    gap: 2,
  },
  hdr: {
    background: 'var(--surf2)',
  },
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
    paddingRight: 4,
  },
  pName: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--txt)',
    paddingLeft: 5,
    display: 'flex',
    alignItems: 'center',
    gap: 3,
  },
  val: {
    fontSize: 13,
    fontWeight: 600,
    textAlign: 'center',
    color: 'var(--txt)',
  },
  fogoTag: {
    fontSize: 7,
    fontWeight: 700,
    color: 'var(--ta)',
    textTransform: 'uppercase',
  },
  inTag: {
    fontSize: 7,
    fontWeight: 700,
    color: 'var(--ta)',
  },
};