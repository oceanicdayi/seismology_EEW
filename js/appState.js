const appState = (() => {
  let state = {
    currentRoute: '#home',
    locale: 'zh-TW',
    picking: {
      scenarioId: 'scenario_01',
      stations: [],
      locationResult: null,
      magnitudeResult: null
    },
    timeline: {
      stationCount: 50,
      isPlaying: false,
      elapsedTime: 0,
      phase: 'idle'
    },
    agentDashboard: {
      repEvent: null,
      agentStates: {
        my_agent: 'idle',
        seismo: 'idle',
        seismo_agent: 'idle',
        secondary: 'idle'
      },
      latencyData: []
    }
  };

  const listeners = [];

  function getState() { return state; }

  function setState(partial) {
    const prev = state;
    state = Object.assign({}, state, partial);
    listeners.forEach(fn => fn(state, prev));
  }

  function subscribe(fn) {
    listeners.push(fn);
    return () => { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); };
  }

  return { getState, setState, subscribe };
})();
