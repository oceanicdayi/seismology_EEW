const PickingModule = (() => {
  let _container = null;
  let _bottomCanvas = null, _topCanvas = null;
  let _bottomCtx = null, _topCtx = null;
  let _cw = 0, _ch = 0;
  let _stations = [];
  let _activeStationIdx = 0;
  let _pickingMode = 'P';
  let _onPickCallback = null;

  const COLORS = {
    bg: '#05080f',
    grid: 'rgba(255,255,255,.04)',
    waveform: '#3b82f6',
    pPick: '#22c55e',
    sPick: '#eab308',
    pLine: 'rgba(34,197,94,.6)',
    sLine: 'rgba(234,179,8,.6)',
    cursor: 'rgba(255,255,255,.5)',
    text: '#94a3b8',
    activeStation: '#06b6d4'
  };

  function init(container, onPick) {
    _container = container;
    _onPickCallback = onPick || (() => {});
    container.innerHTML = `
      <div class="canvas-wrap" id="waveform-canvas-wrap">
        <canvas id="waveform-bottom"></canvas>
        <canvas id="waveform-top"></canvas>
      </div>
      <div class="station-tabs" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px"></div>`;

    const wrap = container.querySelector('#waveform-canvas-wrap');
    _bottomCanvas = container.querySelector('#waveform-bottom');
    _topCanvas = container.querySelector('#waveform-top');

    const setup = CanvasUtils.setupCanvas(_bottomCanvas, wrap);
    _bottomCtx = setup.ctx;
    _cw = setup.w; _ch = setup.h;

    const setup2 = CanvasUtils.setupCanvas(_topCanvas, wrap);
    _topCtx = setup2.ctx;

    _setupMouseEvents();
  }

  function _setupMouseEvents() {
    _topCanvas.addEventListener('mousemove', (e) => {
      if (!_stations.length) return;
      const rect = _topCanvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      _drawTopLayer(mx, my);
    });

    _topCanvas.addEventListener('mouseleave', () => {
      _drawTopLayer(-1, -1);
    });

    _topCanvas.addEventListener('click', (e) => {
      if (!_stations.length) return;
      const rect = _topCanvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const sec = (mx / _cw) * 15;
      const st = _stations[_activeStationIdx];
      if (!st) return;

      if (_pickingMode === 'P') {
        st.pickedP = sec;
      } else {
        st.pickedS = sec;
      }
      _drawWaveforms();
      if (_onPickCallback) _onPickCallback(_stations);
    });
  }

  function setStations(stations) {
    _stations = stations.map(s => ({ ...s, pickedP: null, pickedS: null }));
    _activeStationIdx = 0;
    _renderStationTabs();
    _drawWaveforms();
  }

  function _renderStationTabs() {
    const tabContainer = _container.querySelector('.station-tabs');
    if (!tabContainer) return;
    tabContainer.innerHTML = _stations.map((st, i) =>
      `<button class="btn ${i === _activeStationIdx ? 'btn-primary' : 'btn-secondary'}" data-idx="${i}" style="font-size:.8rem;padding:4px 12px">${st.id}</button>`
    ).join('');

    tabContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const idx = parseInt(btn.dataset.idx);
      _activeStationIdx = idx;
      _renderStationTabs();
      _drawWaveforms();
    });
  }

  function _drawWaveforms() {
    const wrap = _container.querySelector('#waveform-canvas-wrap');
    const { ctx, w, h, dpr } = CanvasUtils.setupCanvas(_bottomCanvas, wrap);
    _cw = w; _ch = h;

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);

    CanvasUtils.drawGrid(ctx, w, h, w / 6, h / 4, COLORS.grid);

    const st = _stations[_activeStationIdx];
    if (!st) return;

    const data = WaveformEngine.getWaveform(st.id);
    if (!data) return;

    const margin = 40;
    const drawW = w - margin * 2;
    const drawH = h - margin * 2;
    const midY = h / 2;

    ctx.strokeStyle = COLORS.waveform;
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    for (let i = 0; i < data.length; i++) {
      const x = margin + (i / data.length) * drawW;
      const y = midY + data[i] * (drawH / 2.5);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    if (st.trueP !== undefined) {
      const xP = margin + (st.trueP / 15) * drawW;
      ctx.strokeStyle = COLORS.pLine;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(xP, margin); ctx.lineTo(xP, h - margin); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = COLORS.pPick;
      ctx.font = '11px sans-serif';
      ctx.fillText('P', xP + 4, margin + 14);
    }

    if (st.trueS !== undefined) {
      const xS = margin + (st.trueS / 15) * drawW;
      ctx.strokeStyle = COLORS.sLine;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(xS, margin); ctx.lineTo(xS, h - margin); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = COLORS.sPick;
      ctx.font = '11px sans-serif';
      ctx.fillText('S', xS + 4, margin + 28);
    }

    if (st.pickedP !== null) {
      const xP = margin + (st.pickedP / 15) * drawW;
      ctx.strokeStyle = COLORS.pPick;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(xP, margin); ctx.lineTo(xP, h - margin); ctx.stroke();
      ctx.fillStyle = COLORS.pPick;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('▼ P', xP - 16, margin - 6);
    }

    if (st.pickedS !== null) {
      const xS = margin + (st.pickedS / 15) * drawW;
      ctx.strokeStyle = COLORS.sPick;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(xS, margin); ctx.lineTo(xS, h - margin); ctx.stroke();
      ctx.fillStyle = COLORS.sPick;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('▼ S', xS - 16, margin + 36);
    }

    ctx.fillStyle = COLORS.text;
    ctx.font = '11px sans-serif';
    ctx.fillText(`Station: ${st.id}`, margin, h - 6);
    ctx.fillText('0s', margin, h - 18);
    ctx.fillText('15s', w - margin - 16, h - 18);
  }

  function _drawTopLayer(mx, my) {
    const { ctx } = CanvasUtils.setupCanvas(_topCanvas, _container.querySelector('#waveform-canvas-wrap'));
    ctx.clearRect(0, 0, _cw, _ch);

    if (mx > 0 && my > 0) {
      ctx.strokeStyle = COLORS.cursor;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(mx, 0); ctx.lineTo(mx, _ch); ctx.stroke();
      ctx.setLineDash([]);

      const sec = (mx / _cw) * 15;
      ctx.fillStyle = COLORS.text;
      ctx.font = '11px sans-serif';
      ctx.fillText(`${sec.toFixed(2)}s`, mx + 6, 16);
    }
  }

  function setPickingMode(mode) {
    _pickingMode = mode;
  }

  function getStations() { return _stations; }

  function clearPicks() {
    _stations.forEach(s => { s.pickedP = null; s.pickedS = null; });
    _drawWaveforms();
  }

  function destroy() {
    WaveformEngine.releaseAll();
    _container = null;
  }

  return { init, setStations, setPickingMode, getStations, clearPicks, destroy };
})();
