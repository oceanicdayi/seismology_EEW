const EEWTimelineModule = (() => {
  let _container = null;
  let _canvas = null, _ctx = null;
  let _cw = 0, _ch = 0;
  let _stations = [];
  let _isPlaying = false;
  let _elapsed = 0;
  let _startTime = 0;
  let _speed = 1;
  let _phase = 'idle';
  let _phaseStart = 0;
  let _eventLon = 121.5, _eventLat = 24.0;

  const PHASES = ['idle', 'detecting', 'locating', 'magnitude', 'warning', 'done'];
  const PHASE_DURATIONS = [0, 3000, 2000, 1500, 1000, 0];

  function init(container) {
    _container = container;
    container.innerHTML = `
      <div class="module-b-layout">
        <div class="canvas-wrap" id="timeline-canvas-wrap" style="aspect-ratio:4/3">
          <canvas id="timeline-canvas"></canvas>
        </div>
        <div class="module-b-controls">
          <div class="control-row">
            <button class="btn btn-primary" id="btn-play">${i18n.t('moduleB.play')}</button>
            <button class="btn btn-secondary" id="btn-reset">${i18n.t('moduleB.reset')}</button>
          </div>
          <div class="slider-group">
            <label>${i18n.t('moduleB.stationDensity')}</label>
            <input type="range" id="station-density" min="10" max="200" value="50">
            <span id="density-label" style="font-family:var(--font-mono);color:var(--accent-cyan);font-size:.85rem">50</span>
          </div>
          <div class="slider-group">
            <label>${i18n.t('moduleB.speed')}</label>
            <input type="range" id="speed-control" min="0.5" max="3" step="0.5" value="1">
            <span id="speed-label" style="font-family:var(--font-mono);color:var(--accent-cyan);font-size:.85rem">1×</span>
          </div>
          <div class="module-b-info" id="timeline-info">
            <div>${i18n.t('moduleB.phase')}: <span class="val" id="phase-label">${i18n.t('moduleB.phase.idle')}</span></div>
            <div>${i18n.t('moduleB.blindZone')}: <span class="val" id="blind-zone-label">0 km</span></div>
          </div>
        </div>
      </div>`;

    _canvas = container.querySelector('#timeline-canvas');
    const wrap = container.querySelector('#timeline-canvas-wrap');
    const setup = CanvasUtils.setupCanvas(_canvas, wrap);
    _ctx = setup.ctx; _cw = setup.w; _ch = setup.h;

    _generateStations(50);

    container.querySelector('#station-density').addEventListener('input', (e) => {
      const n = parseInt(e.target.value);
      document.getElementById('density-label').textContent = n;
      _generateStations(n);
      _draw();
      appState.setState({ timeline: { ...appState.getState().timeline, stationCount: n } });
    });

    container.querySelector('#speed-control').addEventListener('input', (e) => {
      _speed = parseFloat(e.target.value);
      document.getElementById('speed-label').textContent = _speed + '×';
    });

    container.querySelector('#btn-play').addEventListener('click', () => {
      if (_isPlaying) _pause();
      else _play();
    });

    container.querySelector('#btn-reset').addEventListener('click', () => {
      _reset();
    });

    _draw();
  }

  function _generateStations(n) {
    const taiwanStations = [];
    for (let i = 0; i < 200; i++) {
      const lon = 120.0 + Math.random() * 2.0;
      const lat = 22.0 + Math.random() * 3.5;
      taiwanStations.push({ lon, lat });
    }
    taiwanStations.sort((a, b) => {
      const da = SeismicMath.distance(a.lon, a.lat, _eventLon, _eventLat);
      const db = SeismicMath.distance(b.lon, b.lat, _eventLon, _eventLat);
      return da - db;
    });
    _stations = taiwanStations.slice(0, n);
  }

  function _play() {
    if (_phase === 'done') _reset();
    _isPlaying = true;
    _startTime = performance.now() - _elapsed;
    _phase = 'detecting';
    _phaseStart = _elapsed;
    document.getElementById('btn-play').textContent = i18n.t('moduleB.pause');
    Animation.start(_tick);
  }

  function _pause() {
    _isPlaying = false;
    Animation.stop();
    document.getElementById('btn-play').textContent = i18n.t('moduleB.play');
    appState.setState({ timeline: { ...appState.getState().timeline, isPlaying: false, elapsedTime: _elapsed, phase: _phase } });
  }

  function _reset() {
    _isPlaying = false; _elapsed = 0; _phase = 'idle';
    Animation.stop();
    document.getElementById('btn-play').textContent = i18n.t('moduleB.play');
    _draw();
    _updateInfo();
  }

  function _tick(now) {
    _elapsed = (now - _startTime) * _speed;

    let phaseIdx = PHASES.indexOf(_phase);
    let cumTime = 0;
    for (let i = 1; i < PHASE_DURATIONS.length; i++) {
      cumTime += PHASE_DURATIONS[i];
      if (_elapsed < cumTime) {
        const newPhase = PHASES[i];
        if (newPhase !== _phase) { _phase = newPhase; _phaseStart = _elapsed; }
        break;
      }
    }
    if (_elapsed >= cumTime && _phase !== 'done') {
      _phase = 'done';
      _isPlaying = false;
      Animation.stop();
      document.getElementById('btn-play').textContent = i18n.t('moduleB.play');
    }

    _draw();
    _updateInfo();
  }

  function _draw() {
    const { ctx, w, h } = CanvasUtils.setupCanvas(_canvas, _container.querySelector('#timeline-canvas-wrap'));
    _cw = w; _ch = h;

    ctx.fillStyle = '#05080f';
    ctx.fillRect(0, 0, w, h);

    const margin = 30;
    const mapW = w - margin * 2;
    const mapH = h - margin * 2;

    CanvasUtils.drawGrid(ctx, w, h, w / 6, h / 6, 'rgba(255,255,255,.03)');

    const toX = (lon) => margin + ((lon - 120) / 2) * mapW;
    const toY = (lat) => margin + ((25.5 - lat) / 3.5) * mapH;

    for (const st of _stations) {
      const sx = toX(st.lon), sy = toY(st.lat);
      const d = SeismicMath.distance(st.lon, st.lat, _eventLon, _eventLat);
      const pTravel = d / 6.0 * 4.0;

      let color = '#1e293b';
      if (_phase === 'detecting' || _phase === 'locating') {
        if (pTravel * 1000 < _elapsed) color = '#3b82f6';
        else color = '#1e293b';
      } else if (_phase === 'magnitude' || _phase === 'warning' || _phase === 'done') {
        color = '#3b82f6';
      }

      ctx.beginPath();
      ctx.arc(sx, sy, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }

    const ex = toX(_eventLon), ey = toY(_eventLat);
    ctx.beginPath();
    ctx.arc(ex, ey, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EQ', ex, ey + 3);

    if (_phase === 'warning' || _phase === 'done') {
      const blindRadius = Math.max(5, 60 - _stations.length * 0.3);
      ctx.beginPath();
      ctx.arc(ex, ey, blindRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(239,68,68,.12)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(239,68,68,.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      document.getElementById('blind-zone-label').textContent = Math.round(blindRadius * 5) + ' km';
    }

    if (_phase !== 'idle') {
      const progress = _elapsed / PHASE_DURATIONS.slice(1).reduce((a,b) => a+b, 0);
      ctx.fillStyle = 'rgba(59,130,246,.2)';
      ctx.fillRect(margin, h - 10, (w - margin * 2) * Math.min(progress, 1), 6);
    }

    ctx.fillStyle = '#64748b';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('120°E', margin, h - 12);
    ctx.textAlign = 'right';
    ctx.fillText('122°E', w - margin, h - 12);
    ctx.textAlign = 'left';
    ctx.fillText('25.5°N', margin, margin + 10);
    ctx.textAlign = 'left';
    ctx.fillText('22°N', margin, h - margin + 12);
  }

  function _updateInfo() {
    const labels = {
      idle: 'moduleB.phase.idle',
      detecting: 'moduleB.phase.detecting',
      locating: 'moduleB.phase.locating',
      magnitude: 'moduleB.phase.magnitude',
      warning: 'moduleB.phase.warning',
      done: 'moduleB.phase.done'
    };
    document.getElementById('phase-label').textContent = i18n.t(labels[_phase] || 'moduleB.phase.idle');
  }

  function destroy() {
    Animation.stop();
    _container = null;
  }

  return { init, destroy };
})();
