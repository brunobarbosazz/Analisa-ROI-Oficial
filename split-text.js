(function () {
  'use strict';
  function splitWords(element) {
    if (!element || element.dataset.splitTextReady === 'true') return;
    const source = element.textContent.trim();
    if (!source) return;
    element.dataset.splitTextReady = 'true';
    element.setAttribute('aria-label', source);
    element.textContent = '';
    source.split(/(\s+)/).forEach(function (part) {
      if (/^\s+$/.test(part)) return element.appendChild(document.createTextNode(part));
      const word = document.createElement('span');
      word.className = 'split-word'; word.setAttribute('aria-hidden', 'true'); word.textContent = part;
      element.appendChild(word);
    });
    requestAnimationFrame(function () { element.classList.add('split-text-ready'); });
  }
  window.initSplitText = function (root) { (root || document).querySelectorAll('[data-split-text], .land-hero h1').forEach(splitWords); };
  new MutationObserver(function () { window.initSplitText(document); }).observe(document.documentElement, { childList: true, subtree: true });
}());
