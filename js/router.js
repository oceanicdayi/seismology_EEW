const router = (() => {
  const routes = {};
  let currentRoute = null;

  function register(hash, renderFn) {
    routes[hash] = renderFn;
  }

  function navigate(hash) {
    if (!hash.startsWith('#')) hash = '#' + hash;
    if (hash === currentRoute) return;
    history.pushState(null, '', hash);
    _resolve(hash);
  }

  function _resolve(hash) {
    const renderFn = routes[hash];
    const content = document.getElementById('main-content');

    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));

    if (renderFn) {
      renderFn(content);
      currentRoute = hash;
      appState.setState({ currentRoute: hash });
    } else {
      _show404(content);
      appState.setState({ currentRoute: '#404' });
    }

    document.querySelectorAll('nav a').forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === hash);
    });
  }

  function _show404(container) {
    container.innerHTML = `
      <div class="page active not-found">
        <h2>404</h2>
        <p data-i18n="common.pageNotFound">${i18n.t('common.pageNotFound')}</p>
        <button class="btn btn-primary" onclick="router.navigate('#home')">${i18n.t('common.backHome')}</button>
      </div>`;
  }

  function init() {
    window.addEventListener('hashchange', () => _resolve(location.hash));
    window.addEventListener('popstate', () => _resolve(location.hash));
    const hash = location.hash || '#home';
    _resolve(hash);
  }

  return { register, navigate, init };
})();
