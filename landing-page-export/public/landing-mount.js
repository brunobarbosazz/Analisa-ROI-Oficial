(function () {
  var mount = document.querySelector('.landing-reference');
  if (!mount || !window.ANALISA_LANDING_HTML) return;
  var html = window.ANALISA_LANDING_HTML
    .replace(/href="#\/app\/dashboard"/g, 'href="#planos"')
    .replace(/href="#\/app\/integracoes"/g, 'href="#plataformas"')
    .replace(/href="#\/cadastro"/g, 'href="#planos"');
  mount.innerHTML = html;
  if (typeof window.initAnalisaLanding === 'function') window.initAnalisaLanding();
})();
