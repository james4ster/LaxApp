import { useState, useCallback } from 'react';

// strength: 'even' | 'man_up' | 'man_down'
export function useStrength() {
  const [strength, setStrengthState] = useState('even');

  const setStrength = useCallback((val) => {
    setStrengthState(val);
  }, []);

  return { strength, setStrength };
}