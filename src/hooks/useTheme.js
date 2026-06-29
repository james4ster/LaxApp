import { useState, useEffect, useCallback } from 'react';
import { COLOR_PRESETS } from '../lib/constants';

/**
 * useTheme — manages dark/light mode and team color tokens.
 *
 * Colors are applied as CSS custom properties on #root so every
 * component picks them up via var(--tp), var(--ta), etc.
 */
export function useTheme() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  const [themeMode, setThemeMode] = useState('system'); // 'light' | 'dark' | 'system'
  const [isDark, setIsDark] = useState(prefersDark);
  const [activePreset, setActivePreset] = useState(0);

  // Apply dark class to root
  useEffect(() => {
    document.getElementById('root').classList.toggle('dk', isDark);
  }, [isDark]);

  // Listen to system preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      if (themeMode === 'system') setIsDark(e.matches);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [themeMode]);

  const setTheme = useCallback((mode) => {
    setThemeMode(mode);
    if (mode === 'system')
      setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
    else setIsDark(mode === 'dark');
    // TODO: persist to user_preferences table
  }, []);

  const toggleDark = useCallback(() => {
    setIsDark((d) => !d);
    setThemeMode('manual');
  }, []);

  const applyColors = useCallback((p, s, a, pt, at) => {
    const root = document.getElementById('root');
    root.style.setProperty('--tp', p);
    root.style.setProperty('--ts', s);
    root.style.setProperty('--ta', a);
    root.style.setProperty('--tpt', pt);
    root.style.setProperty('--tat', at);
  }, []);

  const applyPreset = useCallback(
    (index) => {
      const pr = COLOR_PRESETS[index];
      if (!pr) return;
      applyColors(pr.p, pr.s, pr.a, pr.pt, pr.at);
      setActivePreset(index);
      // TODO: persist to teams table (primary_color, secondary_color, accent_color)
    },
    [applyColors]
  );

  const applyCustom = useCallback(
    (p, s, a) => {
      applyColors(p, s, a, '#fff', '#111');
      setActivePreset(-1);
    },
    [applyColors]
  );

  // Apply team colors loaded from Supabase
  // Call this once team data is fetched:
  // applyColors(team.primary_color, team.secondary_color, team.accent_color, '#fff', '#111')

  return {
    isDark,
    themeMode,
    activePreset,
    toggleDark,
    setTheme,
    applyPreset,
    applyCustom,
  };
}
