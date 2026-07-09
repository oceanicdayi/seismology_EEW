(async function () {
  let scenarios = [];
  let currentScenario = null;

  function initLoadingAnimation() {
    const c = document.getElementById('loading-canvas');
    if (!c) return;
    const ctx = c.getContext('2d');
    let t = 0;
    function draw() {
      ctx.fillStyle = '#0a0e1a';
      ctx.fillRect(0, 0, 300, 80);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x < 300; x++) {
        const y = 40 + Math.sin((x + t) * 0.05) * 15 + Math.sin((x + t) * 0.12) * 8;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      t++;
      if (!document.getElementById('loading-overlay').classList.contains('hidden')) {
        requestAnimationFrame(draw);
      }
    }
    draw();
  }

  async function loadScenarios() {
    try {
      const resp = await fetch('js/scenarios.json');
      scenarios = await resp.json();
    } catch (e) {
      console.error('Failed to load scenarios:', e);
      scenarios = [];
    }
  }

  async function init() {
    initLoadingAnimation();
    await i18n.init('zh-TW');
    await loadScenarios();

    router.register('#home', renderHome);
    router.register('#module-a', renderModuleA);
    router.register('#module-b', renderModuleB);
    router.register('#module-c', renderModuleC);
    router.register('#readings', renderReadings);

    document.getElementById('lang-switch').addEventListener('click', async () => {
      const newLocale = i18n.getLocale() === 'zh-TW' ? 'en' : 'zh-TW';
      await i18n.setLocale(newLocale);
      document.getElementById('lang-switch').textContent = newLocale === 'zh-TW' ? 'EN' : '中文';
      document.title = i18n.t('site.title');
      router.navigate(location.hash || '#home');
    });

    document.getElementById('loading-overlay').classList.add('hidden');

    router.init();
  }

  function renderHome(container) {
    container.innerHTML = `
      <div class="page active">
        <div class="hero">
          <h2>${i18n.t('landing.hero.title')}</h2>
          <p>${i18n.t('landing.hero.desc')}</p>
        </div>
        <div class="card-grid">
          <div class="card" onclick="router.navigate('#module-a')">
            <h3>${i18n.t('landing.cardA.title')}</h3>
            <p>${i18n.t('landing.cardA.desc')}</p>
          </div>
          <div class="card" onclick="router.navigate('#module-b')">
            <h3>${i18n.t('landing.cardB.title')}</h3>
            <p>${i18n.t('landing.cardB.desc')}</p>
          </div>
          <div class="card" onclick="router.navigate('#module-c')">
            <h3>${i18n.t('landing.cardC.title')}</h3>
            <p>${i18n.t('landing.cardC.desc')}</p>
          </div>
          <div class="card" onclick="router.navigate('#readings')">
            <h3>${i18n.t('landing.cardD.title')}</h3>
            <p>${i18n.t('landing.cardD.desc')}</p>
          </div>
        </div>
        <div class="timeline-section">
          <h3>${i18n.t('landing.timeline.title')}</h3>
          <div class="timeline-bar">
            <div class="timeline-track" style="width:93%"></div>
            <div class="timeline-marker" style="left:0"><span class="timeline-marker-label">1994<br>102s</span></div>
            <div class="timeline-marker" style="left:35%"><span class="timeline-marker-label">2004<br>45s</span></div>
            <div class="timeline-marker" style="left:62%"><span class="timeline-marker-label">2012<br>20s</span></div>
            <div class="timeline-marker" style="left:82%"><span class="timeline-marker-label">2020<br>10s</span></div>
            <div class="timeline-marker" style="left:93%"><span class="timeline-marker-label">2024<br>7s</span></div>
          </div>
          <div class="timeline-labels">
            <span>1994: 102s</span>
            <span>2004: 45s</span>
            <span>2012: 20s</span>
            <span>2020: 10s</span>
            <span>2024: 7s</span>
          </div>
        </div>
      </div>`;
  }

  function renderModuleA(container) {
    container.innerHTML = `
      <div class="page active">
        <h2 style="font-size:1.3rem;margin-bottom:16px;color:var(--accent-cyan)" data-i18n="moduleA.title">${i18n.t('moduleA.title')}</h2>
        <p style="font-size:.88rem;color:var(--text-secondary);margin-bottom:16px" data-i18n="moduleA.instructions">${i18n.t('moduleA.instructions')}</p>
        <div class="module-a-layout">
          <div id="picking-container"></div>
          <div class="module-a-controls">
            <div class="control-row">
              <select id="scenario-select" style="flex:1">
                ${scenarios.map((s, i) => `<option value="${i}">${i18n.getLocale() === 'zh-TW' ? s.name : s.nameEn}</option>`).join('')}
              </select>
            </div>
            <div class="slider-group">
              <label data-i18n="moduleA.snr">${i18n.t('moduleA.snr')}</label>
              <input type="range" id="snr-control" min="3" max="30" value="15" style="flex:1">
              <span id="snr-label" style="font-family:var(--font-mono);color:var(--accent-cyan);font-size:.85rem">15dB</span>
            </div>
            <div class="control-row">
              <button class="btn btn-secondary" id="pick-p-btn" data-i18n="moduleA.markP">${i18n.t('moduleA.markP')}</button>
              <button class="btn btn-secondary" id="pick-s-btn" data-i18n="moduleA.markS">${i18n.t('moduleA.markS')}</button>
            </div>
            <div class="control-row">
              <button class="btn btn-primary" id="locate-btn" data-i18n="moduleA.locate">${i18n.t('moduleA.locate')}</button>
              <button class="btn btn-danger" id="clear-btn" data-i18n="moduleA.clear">${i18n.t('moduleA.clear')}</button>
            </div>
            <div id="location-result"></div>
            <div id="magnitude-result"></div>
          </div>
        </div>
      </div>`;

    const pickContainer = container.querySelector('#picking-container');
    PickingModule.init(pickContainer, (stations) => {
      appState.setState({ picking: { ...appState.getState().picking, stations } });
    });
    PickingModule.setPickingMode('P');

    const loadScenario = (idx) => {
      const sc = scenarios[idx];
      if (!sc) return;
      currentScenario = sc;
      const snr = parseInt(document.getElementById('snr-control').value);
      const metas = WaveformEngine.generateWaveforms(sc.stations, sc, snr);
      const stationsWithCoords = sc.stations.map((st, i) => ({
        ...st,
        ...metas[i],
        trueLon: sc.trueLon,
        trueLat: sc.trueLat
      }));
      PickingModule.setStations(stationsWithCoords);
      appState.setState({ picking: { ...appState.getState().picking, scenarioId: sc.id, stations: stationsWithCoords } });
      document.getElementById('location-result').innerHTML = '';
      document.getElementById('magnitude-result').innerHTML = '';
    };

    container.querySelector('#scenario-select').addEventListener('change', (e) => {
      loadScenario(parseInt(e.target.value));
    });
    loadScenario(0);

    container.querySelector('#snr-control').addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      document.getElementById('snr-label').textContent = val + 'dB';
      if (val < 3) {
        document.getElementById('snr-label').style.color = 'var(--accent-red)';
      } else {
        document.getElementById('snr-label').style.color = '';
      }
    });

    container.querySelector('#pick-p-btn').addEventListener('click', () => {
      PickingModule.setPickingMode('P');
      document.getElementById('pick-p-btn').classList.add('btn-primary');
      document.getElementById('pick-p-btn').classList.remove('btn-secondary');
      document.getElementById('pick-s-btn').classList.add('btn-secondary');
      document.getElementById('pick-s-btn').classList.remove('btn-primary');
    });

    container.querySelector('#pick-s-btn').addEventListener('click', () => {
      PickingModule.setPickingMode('S');
      document.getElementById('pick-s-btn').classList.add('btn-primary');
      document.getElementById('pick-s-btn').classList.remove('btn-secondary');
      document.getElementById('pick-p-btn').classList.add('btn-secondary');
      document.getElementById('pick-p-btn').classList.remove('btn-primary');
    });

    container.querySelector('#locate-btn').addEventListener('click', () => {
      const stations = PickingModule.getStations();
      const valid = stations.filter(s => s.pickedP !== null);
      if (valid.length < 3) {
        document.getElementById('location-result').innerHTML =
          `<div class="result-box"><span style="color:var(--accent-red)">${i18n.t('moduleA.needThreeStations')}</span></div>`;
        return;
      }
      const locResult = LocationModule.compute(stations);
      LocationModule.renderResult(document.getElementById('location-result'), locResult, currentScenario);

      const magResult = MagnitudeModule.compute(stations, locResult ? locResult.depth : 10);
      MagnitudeModule.renderResult(document.getElementById('magnitude-result'), magResult, currentScenario);
    });

    container.querySelector('#clear-btn').addEventListener('click', () => {
      PickingModule.clearPicks();
      document.getElementById('location-result').innerHTML = '';
      document.getElementById('magnitude-result').innerHTML = '';
    });
  }

  function renderModuleB(container) {
    container.innerHTML = `
      <div class="page active">
        <h2 style="font-size:1.3rem;margin-bottom:16px;color:var(--accent-cyan)" data-i18n="moduleB.title">${i18n.t('moduleB.title')}</h2>
        <div id="timeline-container"></div>
      </div>`;
    EEWTimelineModule.init(container.querySelector('#timeline-container'));
  }

  function renderModuleC(container) {
    container.innerHTML = `
      <div class="page active">
        <h2 style="font-size:1.3rem;margin-bottom:16px;color:var(--accent-cyan)" data-i18n="moduleC.title">${i18n.t('moduleC.title')}</h2>
        <div id="agent-container"></div>
      </div>`;
    AgentDashboardModule.init(container.querySelector('#agent-container'));
  }

  function renderReadings(container) {
    container.innerHTML = `
      <div class="page active" id="readings-container"></div>`;
    ReadingsModule.init(container.querySelector('#readings-container'));
  }

  init();
})();
