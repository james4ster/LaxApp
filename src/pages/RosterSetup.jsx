import React, { useState } from 'react';

const POSITIONS = ['ATT', 'MID', 'DEF', 'FOGO', 'LSM', 'GK'];

function PlayerRow({ player, onUpdate, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [name,    setName]    = useState(player.full_name);
  const [num,     setNum]     = useState(player.jersey_number ?? '');
  const [pos,     setPos]     = useState(player.position ?? '');
  const [saving,  setSaving]  = useState(false);

  const save = async () => {
    setSaving(true);
    await onUpdate(player.id, {
      full_name:     name,
      jersey_number: num ? Number(num) : null,
      position:      pos || null,
    });
    setSaving(false);
    setEditing(false);
  };

  if (!editing) return (
    <div style={R.row}>
      <div style={R.num}>#{player.jersey_number ?? '–'}</div>
      <div style={R.name}>
        {player.full_name}
        {player.position && <span style={R.pos}>{player.position}</span>}
      </div>
      <button style={R.editBtn} onClick={() => setEditing(true)}>Edit</button>
      <button style={R.removeBtn} onClick={() => onRemove(player.id)}>✕</button>
    </div>
  );

  return (
    <div style={{ ...R.row, flexWrap: 'wrap', gap: 6, padding: '8px 10px' }}>
      <input
        style={R.input} placeholder="Name" value={name}
        onChange={e => setName(e.target.value)}
      />
      <input
        style={{ ...R.input, maxWidth: 56 }} placeholder="#" type="number"
        value={num} onChange={e => setNum(e.target.value)}
      />
      <select style={R.input} value={pos} onChange={e => setPos(e.target.value)}>
        <option value="">Pos</option>
        {POSITIONS.map(p => <option key={p}>{p}</option>)}
      </select>
      <button style={R.saveBtn} onClick={save} disabled={saving}>{saving ? '…' : 'Save'}</button>
      <button style={R.cancelBtn} onClick={() => setEditing(false)}>Cancel</button>
    </div>
  );
}

function AddPlayerForm({ onAdd }) {
  const [name, setName] = useState('');
  const [num,  setNum]  = useState('');
  const [pos,  setPos]  = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async () => {
    if (!name.trim()) { setErr('Name required'); return; }
    setBusy(true); setErr(null);
    try {
      await onAdd({
        full_name:     name.trim(),
        jersey_number: num ? Number(num) : null,
        position:      pos || null,
      });
      setName(''); setNum(''); setPos('');
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  return (
    <div style={R.addForm}>
      <div style={R.addRow}>
        <input style={{ ...R.input, flex: 1 }} placeholder="Player name" value={name} onChange={e => setName(e.target.value)} />
        <input style={{ ...R.input, maxWidth: 56 }} placeholder="#" type="number" value={num} onChange={e => setNum(e.target.value)} />
        <select style={{ ...R.input, maxWidth: 80 }} value={pos} onChange={e => setPos(e.target.value)}>
          <option value="">Pos</option>
          {POSITIONS.map(p => <option key={p}>{p}</option>)}
        </select>
        <button style={R.addBtn} onClick={submit} disabled={busy}>{busy ? '…' : '+ Add'}</button>
      </div>
      {err && <div style={{ fontSize: 11, color: 'var(--danger)', padding: '2px 4px' }}>{err}</div>}
    </div>
  );
}

function BulkPaste({ onBulkAdd }) {
  const [open, setOpen]   = useState(false);
  const [text, setText]   = useState('');
  const [busy, setBusy]   = useState(false);
  const [err,  setErr]    = useState(null);

  // Parse lines like: "7 Grant ATT" or "Grant, 7, ATT"
  const parse = (raw) => {
    return raw.split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .map(l => {
        const parts = l.split(/[\s,\t]+/);
        let num  = null;
        let name = [];
        let pos  = null;
        parts.forEach(p => {
          if (/^\d+$/.test(p) && !num) { num = Number(p); }
          else if (POSITIONS.includes(p.toUpperCase())) { pos = p.toUpperCase(); }
          else { name.push(p); }
        });
        return { full_name: name.join(' '), jersey_number: num, position: pos };
      })
      .filter(r => r.full_name);
  };

  const handleImport = async () => {
    const rows = parse(text);
    if (!rows.length) { setErr('No valid rows found'); return; }
    setBusy(true); setErr(null);
    try {
      await onBulkAdd(rows);
      setText(''); setOpen(false);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  if (!open) return (
    <button style={R.bulkBtn} onClick={() => setOpen(true)}>
      📋 Paste roster from spreadsheet
    </button>
  );

  return (
    <div style={R.bulkPanel}>
      <div style={{ fontSize: 11, color: 'var(--txt2)', marginBottom: 6 }}>
        Paste rows — one player per line.<br />
        Format: <code>7 Grant ATT</code> or <code>Grant, 7, ATT</code>
      </div>
      <textarea
        style={R.textarea}
        rows={8}
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={'7 Grant ATT\n11 Torres MID\n1 Hayes GK'}
      />
      {err && <div style={{ fontSize: 11, color: 'var(--danger)' }}>{err}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button style={R.addBtn} onClick={handleImport} disabled={busy}>{busy ? 'Importing…' : `Import ${parse(text).length} players`}</button>
        <button style={R.cancelBtn} onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  );
}

function CSVUpload({ onBulkAdd, onDownloadTemplate }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState([]);

  const parseCSV = (text) => {
    const lines = text
      .split(/\r?\n/)
      .map(x => x.trim())
      .filter(Boolean);

    if (!lines.length) return [];

    const headers = lines[0]
      .split(',')
      .map(h => h.trim().toLowerCase());

    const hasHeader = headers.some(h =>
      [
        'name',
        'player',
        'full_name',
        'number',
        'jersey_number',
        'jersey number',
        'player name'
      ].includes(h)
    );

    const rows = hasHeader ? lines.slice(1) : lines;

    return rows.map(line => {
      const cols = line.split(',').map(c => c.trim());

      let number = null;
      let name = '';
      let position = null;

      if (hasHeader) {
        const get = (...names) => {
          const idx = headers.findIndex(h => names.includes(h));
          return idx >= 0 ? cols[idx] : '';
        };

        number = get(
          'number',
          'jersey_number',
          'jersey',
          'jersey number'
        );

        name = get(
          'name',
          'player',
          'full_name',
          'player name'
        );
        position = get('position', 'pos');

      } else {
        number = cols[0];
        name = cols[1];
        position = cols[2];
      }

      return {
        full_name: name,
        jersey_number: number ? Number(number) : null,
        position: POSITIONS.includes(position?.toUpperCase())
          ? position.toUpperCase()
          : null,
      };
    })
    .filter(p => p.full_name);
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setErr(null);

    try {
      const text = await file.text();
      const players = parseCSV(text);

      if (!players.length) {
        throw new Error('No players found in CSV');
      }

      setPreview(players);

    } catch (ex) {
      setErr(ex.message);
    }

    setBusy(false);
  };

  const handleImport = async () => {
    setBusy(true);
    setErr(null);

    try {
      await onBulkAdd(preview);
      setPreview([]);
      setOpen(false);
    } catch (e) {
      setErr(e.message);
    }

    setBusy(false);
  };

  if (!open) {
    return (
      <>
        <button
          style={R.bulkBtn}
          onClick={onDownloadTemplate}
        >
          ⬇️ Download roster template
        </button>

        <button
          style={R.bulkBtn}
          onClick={() => setOpen(true)}
        >
          📁 Upload roster CSV
        </button>
      </>
    );
  }

  return (
    <div style={R.bulkPanel}>

      {open && !preview.length && (
      <>
        <div style={{
          fontSize: 11,
          color: 'var(--txt2)'
        }}>
          Upload CSV with columns:
          <br />
          <code>
            jersey_number, full_name, position
          </code>
        </div>

        <label style={R.addBtn}>
          {busy ? 'Reading...' : 'Choose CSV'}

          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFile}
            style={{display:'none'}}
            disabled={busy}
          />
        </label>

        <button
          style={R.cancelBtn}
          onClick={() => setOpen(false)}
          disabled={busy}
        >
          Cancel
        </button>
      </>
    )}

      {preview.length > 0 && (
        <div style={R.previewBox}>

          <div style={{
            fontWeight:700,
            fontSize:13,
            marginBottom:6
          }}>
            Found {preview.length} players
          </div>

          {preview.slice(0,10).map((p,i)=>(
            <div key={i} style={R.previewRow}>
              #{p.jersey_number ?? '–'} {p.full_name}
              {p.position && ` · ${p.position}`}
            </div>
          ))}

          {preview.length > 10 && (
            <div style={{
              fontSize:11,
              color:'var(--txt2)',
              marginTop:4
            }}>
              + {preview.length - 10} more players
            </div>
          )}

          <div style={{
            display:'flex',
            gap:8,
            marginTop:10
          }}>
            <button
              style={R.addBtn}
              onClick={handleImport}
              disabled={busy}
            >
              {busy
                ? 'Importing...'
                : `Import ${preview.length} Players`
              }
            </button>

            <button
              style={R.cancelBtn}
              onClick={() => setPreview([])}
            >
              Cancel
            </button>
          </div>

        </div>
      )}

      {err &&
        <div style={{
          color:'var(--danger)',
          fontSize:11
        }}>
          {err}
        </div>
      }

    </div>
  );
}

/**
 * RosterSetup
 *
 * Fix: this used to call its own usePlayers(teamId) instance, completely
 * disconnected from the usePlayers instance Dashboard uses to compute the
 * roster checkmark/count. Adding a player here updated this component's
 * local state but never touched Dashboard's — so the step card never
 * showed as done. Now players/loading/addPlayer/updatePlayer/removePlayer/
 * bulkAddPlayers all come from Dashboard's single hook instance as props,
 * so there's exactly one source of truth.
 */
export default function RosterSetup({ players, loading, addPlayer, updatePlayer, removePlayer, bulkAddPlayers, onReady }) {
  const downloadTemplate = () => {
    const csv = [
      ['Jersey Number', 'Player Name', 'Position'],
      ['7', 'John Smith', 'ATT'],
      ['12', 'Mike Jones', 'MID'],
      ['33', 'Bob Wilson', 'GK'],
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'LaxTrack_Roster_Template.csv';
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* Player list */}
      {loading && <div style={{ fontSize: 12, color: 'var(--txt2)', padding: 8 }}>Loading…</div>}

      {players.length > 0 && (
        <div style={R.list}>
          {players.map(p => (
            <PlayerRow
              key={p.id}
              player={p}
              onUpdate={updatePlayer}
              onRemove={removePlayer}
            />
          ))}
        </div>
      )}

      {players.length === 0 && !loading && (
        <div style={{ fontSize: 12, color: 'var(--txt2)', padding: '8px 0 12px', textAlign: 'center' }}>
          No players yet — add them below or paste from a spreadsheet.
        </div>
      )}

      {/* Add single player */}
      <AddPlayerForm onAdd={addPlayer} />

      <BulkPaste onBulkAdd={bulkAddPlayers} />

      <CSVUpload
        onBulkAdd={bulkAddPlayers}
        onDownloadTemplate={downloadTemplate}
      />

      {/* Continue CTA */}
      {players.length >= 3 && (
        <button
          style={{ ...R.addBtn, width: '100%', padding: '11px 0', marginTop: 8 }}
          onClick={onReady}
        >
          Roster looks good → Continue
        </button>
      )}
    </div>
  );
}

const R = {
  list: { border: '1px solid var(--bdr)', borderRadius: 9, overflow: 'hidden', marginBottom: 8 },
  row: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px',
    borderBottom: '1px solid var(--bdr)', background: 'var(--surf)',
  },
  num:  { fontSize: 11, fontWeight: 700, color: 'var(--txt2)', minWidth: 28 },
  name: { flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--txt)', display: 'flex', alignItems: 'center', gap: 5 },
  pos:  { fontSize: 9, fontWeight: 700, color: 'var(--ta)', textTransform: 'uppercase' },
  editBtn:   { fontSize: 10, fontWeight: 700, color: 'var(--tp)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 5px' },
  removeBtn: { fontSize: 11, color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 5px' },
  addForm: { display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 6 },
  addRow:  { display: 'flex', gap: 5, flexWrap: 'wrap' },
  input: {
    padding: '8px 8px', borderRadius: 7, border: '1px solid var(--bdr)',
    background: 'var(--surf2)', color: 'var(--txt)', fontSize: 13, outline: 'none',
  },
  addBtn: {
    background: 'var(--tp)', color: 'var(--tpt)', border: 'none',
    borderRadius: 7, padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
  },
  saveBtn: {
    background: 'var(--tp)', color: 'var(--tpt)', border: 'none',
    borderRadius: 7, padding: '7px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
  },
  cancelBtn: {
    background: 'var(--surf2)', color: 'var(--txt2)', border: 'none',
    borderRadius: 7, padding: '7px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
  },
  bulkBtn: {
    background: 'none', border: '1px dashed var(--bdr)',
    borderRadius: 8, color: 'var(--txt2)', fontSize: 12, fontWeight: 600,
    padding: '9px 0', width: '100%', cursor: 'pointer', marginTop: 4,
  },
  bulkPanel: { display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 0' },
  textarea: {
    padding: '8px', borderRadius: 7, border: '1px solid var(--bdr)',
    background: 'var(--surf2)', color: 'var(--txt)', fontSize: 12,
    fontFamily: 'monospace', resize: 'vertical', outline: 'none', width: '100%',
  },
  previewBox: {
    border: '1px solid var(--tp)',
    borderRadius: 10,
    padding: 10,
    background: 'rgba(26,107,58,.05)',
  },
  previewRow: {
    fontSize: 12,
    padding: '4px 0',
    borderBottom: '1px solid var(--bdr)',
    color: 'var(--txt)',
  },
};