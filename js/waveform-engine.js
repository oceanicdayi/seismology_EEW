const WaveformEngine = (() => {
  const _waveforms = new Map();

  function generateWaveforms(stations, scenario, snr) {
    snr = snr || 15;
    const sampleRate = 100;
    const duration = 15;
    const nSamples = duration * sampleRate;
    const noisePower = 1 / Math.pow(10, snr / 10);

    return stations.map(st => {
      const trueP = st.trueP;
      const trueS = st.trueS;
      const data = new Float32Array(nSamples);

      for (let i = 0; i < nSamples; i++) {
        const t = i / sampleRate;
        const noise = Math.random() * 2 - 1;
        let signal = noise * Math.sqrt(noisePower);

        if (t >= trueP) {
          const dt = t - trueP;
          const amp = Math.exp(-dt * 1.5) * Math.sin(2 * Math.PI * 4 * dt);
          signal += amp * 0.3;
        }

        if (t >= trueS) {
          const dt = t - trueS;
          const amp = Math.exp(-dt * 0.8) * Math.sin(2 * Math.PI * 2.5 * dt);
          signal += amp * 0.5;
        }

        data[i] = signal;
      }

      _waveforms.set(st.id, data);
      return {
        id: st.id,
        sampleRate,
        length: nSamples,
        snr,
        trueP,
        trueS
      };
    });
  }

  function getWaveform(stationId) {
    return _waveforms.get(stationId) || null;
  }

  function release(stationId) {
    _waveforms.delete(stationId);
  }

  function releaseAll() {
    _waveforms.clear();
  }

  return { generateWaveforms, getWaveform, release, releaseAll };
})();
