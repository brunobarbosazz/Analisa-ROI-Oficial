(function () {
  var mount = document.querySelector('.landing-reference');
  if (!mount || !window.ANALISA_LANDING_HTML) return;
  var html = window.ANALISA_LANDING_HTML
    .replace(/href="#\/app\/dashboard"/g, 'href="/dashboard"')
    .replace(/href="#\/app\/integracoes"/g, 'href="/integrations"')
    .replace(/href="#\/cadastro"/g, 'href="/signup"');
  mount.innerHTML = html;
  mount.querySelectorAll('.hdr__login, .nav__enter').forEach(function (link) { link.href = '/login'; });
  fetch('/api/auth/config', { credentials: 'same-origin' })
    .then(function (response) { return response.ok ? response.json() : null; })
    .then(function (config) {
      if (!config || !config.demoMode) return;
      mount.querySelectorAll('a[href="/signup"], a[href="/login"]').forEach(function (link) { link.href = '/dashboard'; });
    })
    .catch(function () {});
  if (typeof window.initAnalisaLanding === 'function') window.initAnalisaLanding();
})();
