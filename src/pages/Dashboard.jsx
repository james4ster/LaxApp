import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useTeams } from '../hooks/useTeam';
import TeamSetup from '../pages/TeamSetup';
import RosterSetup from './RosterSetup';
import ScheduleSetup from './ScheduleSetup';
import { usePlayers } from '../hooks/useTeam';


function completeness(team, players, games) {
  return {
    team:     !!(team?.name && team?.gender),
    logo:     !!team?.logo_url,
    roster:   players.length > 0,
    schedule: games.length >= 1,
  };
}

function StepCard({ icon, title, sub, done, optional, active, onClick, children }) {
  return (
    <div style={{
      ...S.card,
      borderColor: done ? 'var(--tp)' : active ? 'var(--bdr)' : 'var(--bdr)',
      background:  done ? 'rgba(26,107,58,.05)' : 'var(--surf)',
    }}>
      <button style={S.cardHead} onClick={onClick}>
        <div style={{
          ...S.stepIcon,
          background: done ? 'var(--tp)' : 'var(--surf2)',
          color:       done ? '#fff' : 'var(--txt2)',
        }}>
          {done ? '✓' : icon}
        </div>
        <div style={S.stepText}>
          <div style={{ ...S.stepTitle, color: done ? 'var(--tp)' : 'var(--txt)' }}>{title}</div>
          <div style={S.stepSub}>{sub}</div>
        </div>
        <div style={{ ...S.chevron, transform: active ? 'rotate(90deg)' : 'none' }}>›</div>
      </button>
      {active && <div style={S.cardBody}>{children}</div>}
    </div>
  );
}

const BLANK_FORM = {
  name:            '',
  gender:          '',
  season_year:     new Date().getFullYear(),
  primary_color:   '#1A6B3A',
  secondary_color: '#0b2e16',
  accent_color:    '#8FD14F',
};

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { teams, loading, createTeam, updateTeam, uploadLogo, reload } = useTeams();

  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [openStep, setOpenStep]             = useState(null);

  const [gameCount, setGameCount] = useState(0);

  // Use first team if none selected
  const team = teams.find(t => t.id === selectedTeamId) ?? teams[0] ?? null;
  const { players = [] } = usePlayers(team?.id);

  // ── Team-edit form state, kept in sync with whichever team is selected ──
  // (This replaces the old direct destructure of teamData/updateField/saveTeam/
  // etc. from a second hook that was never actually being called.)
  const [formFields, setFormFields] = useState(BLANK_FORM);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [formError,  setFormError]  = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);

  useEffect(() => {
    setFormFields(team ? {
      name:            team.name            ?? '',
      gender:          team.gender          ?? '',
      season_year:     team.season_year     ?? new Date().getFullYear(),
      primary_color:   team.primary_color   ?? '#1A6B3A',
      secondary_color: team.secondary_color ?? '#0b2e16',
      accent_color:    team.accent_color    ?? '#8FD14F',
    } : BLANK_FORM);
  }, [team?.id]);

  const updateField = (field, value) =>
    setFormFields(prev => ({ ...prev, [field]: value }));

  const toggleStep = (step) => setOpenStep(s => s === step ? null : step);

  // Handles both creating a brand-new team and updating the selected one.
  const saveTeam = async () => {
    setSaving(true);
    setFormError(null);
    try {
      let result;
      if (team) {
        result = await updateTeam(team.id, formFields);
      } else {
        result = await createTeam(formFields);
        setSelectedTeamId(result.id);
        setOpenStep('logo');
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      return result;
    } catch (e) {
      setFormError(e.message ?? 'Failed to save team');
      return null;
    } finally {
      setSaving(false);
    }
  };

  // Logo uploads need a real team id, so this is only usable once a team exists.
  const handleLogoUpload = async (file) => {
    if (!team?.id) {
      setFormError('Save the team before uploading a logo');
      return null;
    }
    setLogoUploading(true);
    try {
      return await uploadLogo(team.id, file);
    } catch (e) {
      setFormError(e.message ?? 'Logo upload failed');
      return null;
    } finally {
      setLogoUploading(false);
    }
  };

  if (loading) return <div style={S.loading}>Loading…</div>;

  // NOTE: gameCount is never actually updated from ScheduleSetup below, so
  // done.schedule will always read false until ScheduleSetup is wired to
  // report its game count back up (e.g. an onGamesChange callback, similar
  // to RosterSetup's onReady). Flagging rather than guessing at that file's
  // internals since it wasn't provided.
  const done = completeness(team, players, Array(gameCount).fill({}));

  const readyToTrack = done.team && done.roster;

  return (
    <div style={S.page}>

      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={S.appName}>LaxTrack</div>
          <div style={S.welcome}>
            {user?.user_metadata?.full_name || user?.email}
          </div>
        </div>
        <button style={S.signOutBtn} onClick={signOut}>Sign out</button>
      </div>

      {/* Team switcher — shown if coach has multiple teams */}
      {teams.length > 1 && (
        <div style={S.teamSwitcher}>
          {teams.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedTeamId(t.id)}
              style={{
                ...S.teamChip,
                background:  t.id === team?.id ? 'var(--tp)'   : 'var(--surf2)',
                color:       t.id === team?.id ? 'var(--tpt)'  : 'var(--txt)',
                borderColor: t.id === team?.id ? 'var(--tp)'   : 'var(--bdr)',
              }}
            >
              {t.logo_url && (
                <img src={t.logo_url} alt="" style={{ width: 18, height: 18, borderRadius: 3, objectFit: 'contain' }} />
              )}
              {t.name}
            </button>
          ))}
          <button style={S.addTeamBtn} onClick={() => { setSelectedTeamId(null); setOpenStep('team'); }}>
            + New team
          </button>
        </div>
      )}

      {/* Setup steps */}
      <div style={S.steps}>

        {/* Step 1 — Team */}
        <StepCard
          icon="🏑"
          title={team ? team.name : 'Create your team'}
          sub={team
            ? `${team.gender === 'boys' ? '♂ Boys' : '♀ Girls'} · ${team.season_year ?? 'No season set'}`
            : 'Name, gender, season year'}
          done={done.team}
          active={openStep === 'team'}
          onClick={() => toggleStep('team')}
        >
          <TeamSetup
            team={formFields}
            logoPreview={team?.logo_url ?? null}
            onLogoUpload={handleLogoUpload}
            onFieldChange={updateField}
            onCreate={saveTeam}
            onUpdate={saveTeam}
            saving={saving}
            saved={saved}
            uploading={logoUploading}
            error={formError}
            teamId={team?.id ?? null}
          />
        </StepCard>

        {/* Step 2 — Logo */}
        {team && (
          <StepCard
            icon="🖼"
            title="Team logo"
            sub={
              team?.logo_url
                ? 'Logo uploaded ✓'
                : 'Optional — no logo added'
            }
            active={openStep === 'logo'}
            onClick={() => toggleStep('logo')}
          >
            <LogoUploader
              team={team}
              onUpload={handleLogoUpload}
              onDone={async () => {
                await reload();
              }}
            />

          </StepCard>
        )}

        {/* Step 3 — Roster */}
        {team && (
          <StepCard
            icon="👥"
            title="Roster"
            sub={
              players.length > 0
                ? `${players.length} players loaded`
                : 'Import or add your roster'
            }
            done={done.roster}
            active={openStep === 'roster'}
            onClick={() => toggleStep('roster')}
          >
            <RosterSetup 
              teamId={team.id}
              onReady={() => setOpenStep('schedule')}
            />
          </StepCard>
        )}

        {/* Step 4 — Schedule */}
        {team && (
          <StepCard
            icon="📅"
            title="Schedule"
            sub={
              gameCount > 0
                ? `${gameCount} games added`
                : 'Add upcoming games (optional)'
            }
            done={done.schedule}
            active={openStep === 'schedule'}
            onClick={() => toggleStep('schedule')}
          >
            <ScheduleSetup
              teamId={team.id}
            />
          </StepCard>
        )}

      </div>

      {/* Ready to track CTA */}
      {readyToTrack && (
        <div style={S.cta}>
          <div style={S.ctaText}>
            <div style={S.ctaTitle}>Ready to track!</div>
            <div style={S.ctaSub}>{team?.name} is set up and ready for game day.</div>
          </div>
          <a href="/track" style={S.ctaBtn}>Start tracking →</a>
        </div>
      )}

      {/* Empty state — no teams yet */}
      {!team && !loading && (
        <div style={S.empty}>
          <div style={{ fontSize: 48 }}>🥍</div>
          <div style={S.emptyTitle}>Welcome to LaxTrack</div>
          <div style={S.emptySub}>Set up your team to get started tracking stats live.</div>
          <button style={S.createBtn} onClick={() => setOpenStep('team')}>
            Create your first team
          </button>
        </div>
      )}

    </div>
  );
}

// ── Logo uploader (inline, no separate file needed at this stage) ─────────
function LogoUploader({ team, onUpload, onDone }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview]     = useState(team?.logo_url ?? null);
  const [err, setErr]             = useState(null);

  useEffect(() => {
    setPreview(team?.logo_url ?? null);
  }, [team?.logo_url]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErr('File must be under 2MB');
      return;
    }

    setErr(null);
    setUploading(true);

    try {
      const url = await onUpload(file);
      if (url) {
        setPreview(url);
        await onDone(url);
      }
    } catch (ex) {
      setErr(ex.message);
    }

    setUploading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '8px 0 4px' }}>
      {preview && (
        <img src={preview} alt="logo preview" style={{ width: 80, height: 80, objectFit: 'contain', borderRadius: 10, border: '1px solid var(--bdr)' }} />
      )}
      <label style={S.uploadLabel}>
        {uploading ? 'Uploading…' : preview ? 'Replace logo' : 'Choose file'}
        <input type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} disabled={uploading} />
      </label>
      {err && <div style={{ fontSize: 11, color: 'var(--danger)' }}>{err}</div>}
      <div style={{ fontSize: 11, color: 'var(--txt2)' }}>PNG or JPG, max 2MB</div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const S = {
  page: {
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    minHeight: '100dvh',
    background: 'var(--bg)',
    padding: '0 24px 40px',
    display: 'flex',
    flexDirection: 'column',
  },
  loading: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100dvh', color: 'var(--txt2)', fontSize: 14,
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 14px 12px',
    background: 'var(--ts)',
  },
  appName: { fontSize: 18, fontWeight: 800, color: 'var(--ta)', letterSpacing: .5 },
  welcome: { fontSize: 12, color: 'rgba(255,255,255,.5)', marginTop: 2 },
  signOutBtn: {
    background: 'rgba(255,255,255,.1)', border: 'none',
    color: 'rgba(255,255,255,.6)', fontSize: 11, fontWeight: 600,
    borderRadius: 7, padding: '5px 10px', cursor: 'pointer',
  },
  teamSwitcher: {
    display: 'flex', gap: 6, padding: '10px 12px',
    overflowX: 'auto', WebkitOverflowScrolling: 'touch',
    background: 'var(--surf)', borderBottom: '1px solid var(--bdr)',
  },
  teamChip: {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '5px 10px', borderRadius: 20, border: '1px solid',
    fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
  },
  addTeamBtn: {
    padding: '5px 10px', borderRadius: 20,
    border: '1px dashed var(--bdr)', background: 'none',
    color: 'var(--txt2)', fontSize: 12, cursor: 'pointer', flexShrink: 0,
  },
  steps: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 16,
    padding: '20px 0',
  },
  card: {
    background: 'var(--surf)', borderRadius: 12,
    border: '1px solid', overflow: 'hidden',
  },
  cardHead: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 12px', width: '100%',
    background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
  },
  cardBody: { padding: '0 12px 14px', borderTop: '1px solid var(--bdr)' },
  stepIcon: {
    width: 36, height: 36, borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 16, fontWeight: 700, flexShrink: 0,
    transition: 'background .15s',
  },
  stepText: { flex: 1, minWidth: 0 },
  stepTitle: { fontSize: 14, fontWeight: 700, lineHeight: 1.3 },
  stepSub:   { fontSize: 11, color: 'var(--txt2)', marginTop: 2 },
  chevron:   { fontSize: 18, color: 'var(--txt2)', transition: 'transform .15s', flexShrink: 0 },
  cta: {
    margin: '4px 10px',
    background: 'var(--tp)', borderRadius: 12,
    padding: '14px 14px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
  },
  ctaText:  {},
  ctaTitle: { fontSize: 15, fontWeight: 800, color: 'var(--tpt)' },
  ctaSub:   { fontSize: 11, color: 'rgba(255,255,255,.65)', marginTop: 2 },
  ctaBtn: {
    background: 'var(--ta)', color: 'var(--tat)',
    borderRadius: 9, padding: '9px 14px',
    fontSize: 12, fontWeight: 800, textDecoration: 'none', flexShrink: 0,
  },
  empty: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '40px 24px', gap: 10,
  },
  emptyTitle: { fontSize: 20, fontWeight: 800, color: 'var(--txt)' },
  emptySub:   { fontSize: 13, color: 'var(--txt2)', textAlign: 'center', lineHeight: 1.5 },
  createBtn: {
    marginTop: 8, background: 'var(--tp)', color: 'var(--tpt)',
    border: 'none', borderRadius: 10, padding: '12px 24px',
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
  },
  uploadLabel: {
    background: 'var(--tp)', color: 'var(--tpt)',
    borderRadius: 8, padding: '9px 18px',
    fontSize: 13, fontWeight: 700, cursor: 'pointer',
  },
};