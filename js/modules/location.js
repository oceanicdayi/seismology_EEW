const LocationModule = (() => {
  let _result = null;

  function compute(stations) {
    const valid = stations.filter(s => s.pickedP !== null);
    if (valid.length < 3) {
      _result = null;
      return null;
    }

    const lon0 = valid.reduce((s, st) => s + st.lon, 0) / valid.length;
    const lat0 = valid.reduce((s, st) => s + st.lat, 0) / valid.length;
    const depth0 = 10;

    const result = SeismicMath.locateGeiger(valid, lon0, lat0, depth0, 20);

    const trueLon = valid[0].trueLon !== undefined ? valid[0].trueLon : null;
    const trueLat = valid[0].trueLat !== undefined ? valid[0].trueLat : null;

    let errorKm = NaN;
    if (trueLon !== null && trueLat !== null) {
      errorKm = SeismicMath.distance(result.lon, result.lat, trueLon, trueLat);
    } else {
      errorKm = result.errorKm;
    }

    _result = { ...result, errorKm };
    return _result;
  }

  function getResult() { return _result; }

  function renderResult(container, result, scenario) {
    if (!result) {
      container.innerHTML = `<div class="result-box"><span class="label">${i18n.t('moduleA.needThreeStations')}</span></div>`;
      return;
    }

    const trueLon = scenario ? scenario.trueLon : null;
    const trueLat = scenario ? scenario.trueLat : null;
    const trueDepth = scenario ? scenario.trueDepth : null;
    const lonError = trueLon ? ((result.lon - trueLon) * 111.32 * 1000).toFixed(1) : '--';
    const latError = trueLat ? ((result.lat - trueLat) * 111.32 * 1000).toFixed(1) : '--';

    container.innerHTML = `
      <div class="result-box">
        <span class="label">${i18n.t('moduleA.locationResult')}</span><br>
        經度: <span class="value">${result.lon.toFixed(3)}°</span>
        ${trueLon ? `<span style="color:var(--text-muted)"> (參考: ${trueLon.toFixed(3)}° Δ=${lonError}m)</span>` : ''}<br>
        緯度: <span class="value">${result.lat.toFixed(3)}°</span>
        ${trueLat ? `<span style="color:var(--text-muted)"> (參考: ${trueLat.toFixed(3)}° Δ=${latError}m)</span>` : ''}<br>
        深度: <span class="value">${result.depth.toFixed(1)} km</span>
        ${trueDepth ? `<span style="color:var(--text-muted)"> (參考: ${trueDepth} km)</span>` : ''}<br>
        誤差: <span class="value">${result.errorKm.toFixed(2)} km</span>
      </div>`;
  }

  return { compute, getResult, renderResult };
})();
