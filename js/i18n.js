const i18n = (() => {
  let locale = 'zh-TW';
  let strings = {};
  let fallbacks = {};

  const fallbackZh = {
    'site.title': '地震預警互動學習平台',
    'nav.home': '首頁',
    'common.loading': '載入中...',
    'common.error': '發生錯誤',
    'common.backHome': '返回首頁',
    'common.pageNotFound': '頁面不存在'
  };

  const fallbackEn = {
    'site.title': 'EEW Interactive Platform',
    'nav.home': 'Home',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.backHome': 'Back to Home',
    'common.pageNotFound': 'Page not found'
  };

  async function init(initialLocale) {
    locale = initialLocale || 'zh-TW';
    fallbacks = locale === 'zh-TW' ? fallbackZh : fallbackEn;
    try {
      const resp = await fetch(`i18n/${locale}.json`);
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      strings = await resp.json();
    } catch (e) {
      console.error('i18n load failed:', e);
      strings = fallbacks;
    }
  }

  function t(key, ...args) {
    let s = strings[key] || fallbacks[key] || key;
    if (args.length) args.forEach((a, i) => { s = s.replace(`{${i}}`, a); });
    return s;
  }

  function setLocale(newLocale) {
    if (newLocale === locale) return;
    locale = newLocale;
    fallbacks = locale === 'zh-TW' ? fallbackZh : fallbackEn;
    return init(locale);
  }

  function getLocale() { return locale; }

  return { init, t, setLocale, getLocale };
})();
