const AgentDashboardModule = (() => {
  let _container = null;
  let _agents = [
    { id: 'my_agent', labelKey: 'moduleC.agent.myAgent', status: 'idle', x: 50, y: 50 },
    { id: 'seismo', labelKey: 'moduleC.agent.seismo', status: 'idle', x: 350, y: 50 },
    { id: 'seismo_agent', labelKey: 'moduleC.agent.seismoAgent', status: 'idle', x: 200, y: 180 },
    { id: 'secondary', labelKey: 'moduleC.agent.secondary', status: 'idle', x: 500, y: 180 }
  ];
  let _latencyData = [];
  let _isRunning = false;
  let _step = 0;
  const STEP_DELAY = 1200;

  function init(container) {
    _container = container;
    _render();
    _generateLatencyData();
  }

  function _render() {
    _container.innerHTML = `
      <div class="module-c-layout">
        <div class="agent-svg-wrap" id="agent-svg-wrap"></div>
        <div class="module-c-controls">
          <button class="btn btn-primary" id="btn-trigger">${i18n.t('moduleC.trigger')}</button>
          <button class="btn btn-secondary" id="btn-regenerate">${i18n.t('moduleC.regenerate')}</button>
          <div class="module-c-stats" id="latency-stats">
            <h4 style="margin-bottom:8px;font-size:.9rem">${i18n.t('moduleC.latencyChart')}</h4>
            <div id="latency-chart"></div>
          </div>
          <div class="module-c-stats" id="daily-report">
            <h4 style="margin-bottom:8px;font-size:.9rem">${i18n.t('moduleC.dailyReport')}</h4>
            <div id="report-content" style="font-size:.82rem;color:var(--text-secondary)">--</div>
          </div>
        </div>
      </div>`;

    _drawSVG();
    _renderLatencyChart();

    _container.querySelector('#btn-trigger').addEventListener('click', () => _runPipeline());
    _container.querySelector('#btn-regenerate').addEventListener('click', () => { _generateLatencyData(); _renderLatencyChart(); });
  }

  function _drawSVG() {
    const wrap = _container.querySelector('#agent-svg-wrap');
    const w = 600, h = 280;

    let svg = `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">`;

    const connections = [
      ['my_agent', 'seismo'], ['my_agent', 'seismo_agent'],
      ['seismo', 'secondary'], ['seismo_agent', 'secondary']
    ];

    for (const [from, to] of connections) {
      const a = _agents.find(x => x.id === from);
      const b = _agents.find(x => x.id === to);
      if (!a || !b) continue;
      const color = (a.status === 'done' || a.status === 'processing') ? '#3b82f6' : '#1e293b';
      svg += `<line x1="${a.x + 70}" y1="${a.y + 30}" x2="${b.x}" y2="${b.y + 30}" stroke="${color}" stroke-width="2" stroke-dasharray="6,3"/>`;
    }

    for (const agent of _agents) {
      const colors = { idle: '#1e293b', processing: '#f97316', done: '#22c55e', error: '#ef4444' };
      const statusColors = { idle: '#64748b', processing: '#f97316', done: '#22c55e', error: '#ef4444' };
      const c = colors[agent.status] || '#1e293b';
      const sc = statusColors[agent.status] || '#64748b';

      svg += `<rect x="${agent.x}" y="${agent.y}" width="140" height="60" rx="8" fill="#1a2240" stroke="${c}" stroke-width="2"/>`;
      svg += `<text x="${agent.x + 70}" y="${agent.y + 26}" text-anchor="middle" fill="#e2e8f0" font-size="13" font-weight="600">${i18n.t(agent.labelKey)}</text>`;
      svg += `<text x="${agent.x + 70}" y="${agent.y + 45}" text-anchor="middle" fill="${sc}" font-size="11">${i18n.t('moduleC.status.' + agent.status)}</text>`;
    }

    svg += '</svg>';
    wrap.innerHTML = svg;
  }

  function _runPipeline() {
    if (_isRunning) return;
    _isRunning = true;
    _step = 0;
    _agents.forEach(a => a.status = 'idle');
    _drawSVG();

    const simulateStep = () => {
      if (_step >= _agents.length) {
        _isRunning = false;
        _agents.forEach(a => a.status = 'done');
        _drawSVG();
        document.getElementById('report-content').innerHTML = _generateReport();
        return;
      }

      const agent = _agents[_step];
      agent.status = 'processing';
      _drawSVG();

      setTimeout(() => {
        agent.status = Math.random() > 0.1 ? 'done' : 'done';
        _drawSVG();
        _step++;
        setTimeout(simulateStep, STEP_DELAY * 0.5);
      }, STEP_DELAY);
    };

    simulateStep();
  }

  function _generateLatencyData() {
    const stages = [
      { key: 'Detect', label: 'moduleB.phase.detecting', median: 2800 },
      { key: 'Locate', label: 'moduleB.phase.locating', median: 1800 },
      { key: 'Mag', label: 'moduleB.phase.magnitude', median: 1200 },
      { key: 'Warn', label: 'moduleB.phase.warning', median: 800 }
    ];

    _latencyData = stages.map(s => {
      const jitter = (Math.random() - 0.5) * 2 * s.median * 0.15;
      return { ...s, value: Math.round(s.median + jitter) };
    });
  }

  function _renderLatencyChart() {
    const chartEl = _container ? _container.querySelector('#latency-chart') : null;
    if (!chartEl) return;

    const maxVal = Math.max(..._latencyData.map(d => d.value), 1);
    chartEl.innerHTML = _latencyData.map(d => {
      const pct = (d.value / maxVal) * 100;
      return `
        <div style="margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;font-size:.78rem;color:var(--text-muted);margin-bottom:2px">
            <span>${i18n.t(d.label)}</span>
            <span style="font-family:var(--font-mono);color:var(--accent-cyan)">${d.value}ms</span>
          </div>
          <div style="height:6px;background:var(--bg-primary);border-radius:3px;overflow:hidden">
            <div style="height:100%;width:${pct}%;background:var(--accent-blue);border-radius:3px;transition:width .6s ease"></div>
          </div>
        </div>`;
    }).join('');
  }

  function _generateReport() {
    const total = _latencyData.reduce((s, d) => s + d.value, 0);
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    return `
      <div style="line-height:1.8">
        <div>📋 ${dateStr}</div>
        <div>✅ 事件處理完成</div>
        <div>⚡ 總延遲: ${total}ms</div>
        <div>🤖 參與 Agent: ${_agents.length}</div>
      </div>`;
  }

  function destroy() {
    _container = null;
    _isRunning = false;
  }

  return { init, destroy };
})();
