const ReadingsModule = (() => {
  let _container = null;

  const SECTIONS = [
    { key: 'section1', icon: '⚖️' },
    { key: 'section2', icon: '🤖' },
    { key: 'section3', icon: '⚠️' },
    { key: 'section4', icon: '🧠' }
  ];

  function init(container) {
    _container = container;
    _render();
  }

  function _render() {
    _container.innerHTML = `
      <div class="page active">
        <h2 style="font-size:1.4rem;margin-bottom:24px;color:var(--accent-cyan)" data-i18n="readings.title">${i18n.t('readings.title')}</h2>
        <div class="readings-list">
          ${SECTIONS.map((s, i) => `
            <div class="reading-card" data-section="${s.key}">
              <div class="reading-card-header">
                <h3>${s.icon} ${i18n.t('readings.' + s.key + '.title')}</h3>
                <span class="toggle-icon">▼</span>
              </div>
              <div class="reading-card-body">
                <p>${i18n.t('readings.' + s.key + '.content')}</p>
                ${i === 0 || i === 1 ? `
                  <div style="margin-top:16px">
                    <button class="btn btn-primary" onclick="router.navigate('#module-a')">${i18n.t('readings.backToModules')}</button>
                  </div>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>`;

    _container.querySelectorAll('.reading-card-header').forEach(header => {
      header.addEventListener('click', () => {
        const card = header.closest('.reading-card');
        card.classList.toggle('open');
      });
    });
  }

  function destroy() {
    _container = null;
  }

  return { init, destroy };
})();
