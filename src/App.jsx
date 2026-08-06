import React, { useState } from 'react';
import Dashboard     from './pages/Dashboard';
import Login         from './auth/Login';
import TrackRoute    from './routes/TrackRoute';
import GameContainer from './pages/GameContainer';
import { useAuth }   from './auth/AuthProvider';
import ManagerView   from './pages/ManagerView';
import './styles/globals.css';

/**
 * App routing — manual path-based (no react-router needed for this simplicity)
 *
 * PUBLIC  /track/:token   → stat keeper view (no login)
 * PUBLIC  /live/:token    → fan read-only view (no login)
 * PUBLIC  /manage/:token  → team manager view (no login)
 * PRIVATE /dashboard     → coach portal (login required)
 * PRIVATE /              → redirect to dashboard if logged in, else login
 */
export default function App() {
  const path = window.location.pathname;

  // ── Public routes — check BEFORE auth so trackers never see login ────
  if (path.startsWith('/track/'))   return <TrackRoute />;
  if (path.startsWith('/live/'))    return <GameContainer mode="live" />;
  if (path.startsWith('/manage/'))  return <ManagerView />;

  // ── Auth-gated coach portal ──────────────────────────────────────────
  const { user, loading } = useAuth();

  if (loading) return <Splash />;
  if (!user)   return <Login />;

  // ── Coach portal screens ─────────────────────────────────────────────
  return <CoachPortal />;
}

// ── Coach portal — screen state lives here ────────────────────────────────
function CoachPortal() {
  // Valid screens: 'dashboard' | 'team' | 'roster' | 'schedule'
  const [screen, setScreen] = useState(() => {
    // Resume to the screen they were on, or default to dashboard
    return sessionStorage.getItem('coach_screen') ?? 'dashboard';
  });

  const go = (s) => {
    sessionStorage.setItem('coach_screen', s);
    setScreen(s);
  };

  return (
    <div className="portal-shell">
      {screen === 'dashboard' && (
        <Dashboard onNavigate={go} />
      )}
      {screen === 'team' && (
        <TeamSetupScreen onNavigate={go} />
      )}
      {screen === 'roster' && (
        <RosterSetupScreen onNavigate={go} />
      )}
      {screen === 'schedule' && (
        <ScheduleSetupScreen onNavigate={go} />
      )}
    </div>
  );
}

// ── Lazy-import wrappers so auth pages don't load tracker code ────────────
// (replace with React.lazy if bundle size becomes a concern)
import TeamSetup     from './pages/TeamSetup';
import RosterSetup   from './pages/RosterSetup';
import ScheduleSetup from './pages/ScheduleSetup';

function TeamSetupScreen({ onNavigate }) {
  return <TeamSetup onNext={() => onNavigate('roster')} onBack={() => onNavigate('dashboard')} />;
}
function RosterSetupScreen({ onNavigate }) {
  return <RosterSetup onNext={() => onNavigate('schedule')} onBack={() => onNavigate('team')} />;
}
function ScheduleSetupScreen({ onNavigate }) {
  return <ScheduleSetup onNext={() => onNavigate('dashboard')} onBack={() => onNavigate('roster')} />;
}

function Splash() {
  return (
    <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b2e16' }}>
      <div style={{ width: 36, height: 36, border: '3px solid rgba(143,209,79,.3)', borderTop: '3px solid #8fd14f', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}