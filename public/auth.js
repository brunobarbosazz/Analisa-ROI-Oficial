(() => {
  'use strict';
  const form = document.querySelector('#auth-form');
  const status = document.querySelector('#auth-status');
  const demo = document.querySelector('#auth-demo');
  const path = location.pathname.replace(/\/$/, '') || '/login';
  const mode = path === '/signup' ? 'signup' : path === '/recover' ? 'recover' : path === '/reset-password' ? 'reset' : 'login';
  const params = new URLSearchParams(location.search);
  const validNext = value => typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/api/') ? value : '/dashboard';
  const next = validNext(params.get('next'));
  const field = name => document.querySelector(`[data-field="${name}"]`);
  const copy = {
    login: ['Acesse sua conta', 'Entre para continuar no seu workspace.', 'Entrar'],
    signup: ['Crie seu workspace', 'Comece seu teste de 7 dias. Você não precisa adicionar cartão.', 'Criar conta'],
    recover: ['Recuperar senha', 'Enviaremos um link para o e-mail cadastrado.', 'Enviar link'],
    reset: ['Defina uma nova senha', 'Escolha uma senha segura para sua conta.', 'Salvar senha']
  }[mode];
  document.querySelector('#auth-title').textContent = copy[0];
  document.querySelector('#auth-description').textContent = copy[1];
  document.querySelector('#auth-submit').textContent = copy[2];
  field('name').hidden = mode !== 'signup';
  field('password').hidden = mode === 'recover';
  field('confirm').hidden = mode !== 'signup' && mode !== 'reset';
  document.querySelector('[data-link="recover"]').hidden = mode !== 'login';
  document.querySelector('[data-link="signup"]').hidden = mode === 'signup' || mode === 'reset';
  document.querySelector('[data-link="login"]').hidden = mode !== 'signup' && mode !== 'recover';
  const password = form.elements.password;
  if (mode === 'signup' || mode === 'reset') password.autocomplete = 'new-password';
  if (mode === 'recover') document.querySelector('#auth-submit').textContent = 'Enviar instruções';

  function show(message, kind = 'success') {
    status.textContent = message;
    status.dataset.kind = kind;
    status.hidden = false;
  }

  async function request(url, options = {}) {
    const response = await fetch(url, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || 'Não foi possível concluir a solicitação. Tente novamente.');
    return result;
  }

  async function loadConfig() {
    try { return await request('/api/auth/config', { method: 'GET', headers: {} }); }
    catch { return { demoMode: false, authConfigured: false }; }
  }

  (async () => {
    const config = await loadConfig();
    if (config.demoMode || !config.authConfigured) {
      form.hidden = true;
      document.querySelector('#auth-links').hidden = true;
      demo.hidden = false;
      document.querySelector('#auth-demo-copy').textContent = config.demoMode
        ? 'Este ambiente está em modo de demonstração. A autenticação real fica desativada aqui.'
        : 'A autenticação ainda não foi configurada para este ambiente. O painel permanece bloqueado até a conexão com o backend.';
      document.querySelector('.auth-demo-link').hidden = !config.demoMode;
      return;
    }
    if (mode === 'login') {
      try {
        const sessionResponse = await fetch('/api/auth/session', { credentials: 'same-origin' });
        if (sessionResponse.ok) location.replace(next);
        else if (sessionResponse.status === 403) location.replace('/plans?reason=trial_expired');
      } catch {}
    }
    if (params.get('logout') === '1') show('Você saiu da sua conta.');
    if (params.get('error') === 'confirmation') show('O link de confirmação expirou ou já foi usado. Solicite um novo e-mail.', 'error');
    if (params.get('error') === 'unavailable') show('O serviço de autenticação está indisponível. Tente novamente.', 'error');
  })();

  form.addEventListener('submit', async event => {
    event.preventDefault();
    status.hidden = true;
    const button = document.querySelector('#auth-submit');
    const values = new FormData(form);
    const email = String(values.get('email') || '').trim();
    const currentPassword = String(values.get('password') || '');
    const confirm = String(values.get('confirm') || '');
    if ((mode === 'signup' || mode === 'reset') && currentPassword !== confirm) return show('As senhas não coincidem.', 'error');
    button.disabled = true;
    button.textContent = 'Aguarde…';
    try {
      if (mode === 'login') {
        const result = await request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password: currentPassword, next }) });
        location.assign(result.next || next);
      } else if (mode === 'signup') {
        const result = await request('/api/auth/signup', { method: 'POST', body: JSON.stringify({ email, password: currentPassword, name: String(values.get('name') || ''), next }) });
        if (result.confirmationRequired) {
          form.hidden = true;
          document.querySelector('#auth-links').hidden = true;
          show('Conta criada. Confira seu e-mail para confirmar o cadastro. O período de Trial começa na criação da conta.', 'success');
        } else {
          location.assign('/dashboard');
        }
      } else if (mode === 'recover') {
        await request('/api/auth/recover', { method: 'POST', body: JSON.stringify({ email }) });
        show('Se o e-mail estiver cadastrado, você receberá instruções para redefinir a senha.', 'success');
      } else {
        await request('/api/auth/password', { method: 'PUT', body: JSON.stringify({ password: currentPassword }) });
        show('Senha atualizada. Agora você pode entrar com a nova senha.', 'success');
        form.hidden = true;
        document.querySelector('#auth-links').hidden = false;
        document.querySelector('[data-link="login"]').hidden = false;
      }
    } catch (error) {
      show(error.message, 'error');
    } finally {
      button.disabled = false;
      button.textContent = copy[2];
    }
  });
})();
