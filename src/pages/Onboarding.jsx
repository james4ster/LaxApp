import React, { useState } from 'react';
import TeamSetup from './TeamSetup';
import RosterSetup from './RosterSetup';
import ScheduleSetup from './ScheduleSetup';
import Track from './Track';

export default function Onboarding() {

  const [screen, setScreen] = useState('team');

  return (
    <>
      {screen === 'team' && (
        <TeamSetup 
          onNext={() => setScreen('roster')}
        />
      )}

      {screen === 'roster' && (
        <RosterSetup
          onNext={() => setScreen('schedule')}
        />
      )}

      {screen === 'schedule' && (
        <ScheduleSetup
          onNext={() => setScreen('track')}
        />
      )}

      {screen === 'track' && (
        <Track />
      )}
    </>
  );
}