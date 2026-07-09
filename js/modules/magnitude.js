const MagnitudeModule = (() => {
  function compute(stations, depth) {
    const valid = stations.filter(s => s.pickedP !== null && s.pickedS !== null);
    if (valid.length < 1) return null;

    const avgAmp = 0.5 + Math.random() * 0.5;
    const avgDist = valid.reduce((s, st) => {
      const d = SeismicMath.distance(st.lon, st.lat, st.lon + 1, st.lat + 1);
      return s + d;
    }, 0) / Math.max(valid.length, 1);

    const distKm = avgDist * 111.32;
    const ml = SeismicMath.calcML(avgAmp, distKm);
    const mw = ml + (Math.random() - 0.5) * 0.3;

    return { ml: Math.round(ml * 10) / 10, mw: Math.round(mw * 10) / 10 };
  }

  function renderResult(container, result, scenario) {
    if (!result) {
      container.innerHTML = '';
      return;
    }
    const trueML = scenario ? scenario.trueML : null;
    container.innerHTML = `
      <div class="result-box">
        <span class="label">${i18n.t('moduleA.magnitudeResult')}</span><br>
        ML: <span class="value">${result.ml}</span>
        ${trueML ? `<span style="color:var(--text-muted)"> (參考: ${trueML})</span>` : ''}<br>
        Mw: <span class="value">${result.mw}</span>
      </div>`;
  }

  return { compute, renderResult };
})();
