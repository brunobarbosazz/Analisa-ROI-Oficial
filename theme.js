// Light is the default; the user's theme choice persists locally.
if (!localStorage.getItem('vytrix-theme')) localStorage.setItem('vytrix-theme', 'light');
const originalRender = window.render;
window.render = function () {
  originalRender();
  document.documentElement.setAttribute('data-theme', localStorage.getItem('vytrix-theme') === 'dark' ? 'dark' : 'light');
  const app = document.querySelector('.app');
  if (app) app.classList.toggle('dark', localStorage.getItem('vytrix-theme') === 'dark');
};
window.toggleTheme = function () {
  localStorage.setItem('vytrix-theme', localStorage.getItem('vytrix-theme') === 'dark' ? 'light' : 'dark');
  window.render();
};
window.render();
