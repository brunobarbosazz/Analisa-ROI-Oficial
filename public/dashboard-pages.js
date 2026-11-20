(() => {
  "use strict";
  const STATE_KEY = "analisa-roi.dashboard.pages.v1";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const read = () => { try { return JSON.parse(localStorage.getItem(STATE_KEY) || "{}"); } catch { return {}; } };
  const save = updates => { try { localStorage.setItem(STATE_KEY, JSON.stringify({ ...read(), ...updates })); } catch {} };
  function applyDashboardPreferences() {
    const state = read();
    const color = /^#[0-9a-f]{6}$/i.test(state.dashboardColor || "") ? state.dashboardColor : "#1A6DFF";
    const name = typeof state.dashboardName === "string" && state.dashboardName.trim() ? state.dashboardName.trim() : "Dashboard Principal";
    document.body.style.setProperty("--color-primary", color);
    document.body.style.setProperty("--color-primary-hover", `color-mix(in srgb, ${color} 82%, black)`);
    document.body.style.setProperty("--color-primary-light", `color-mix(in srgb, ${color} 12%, var(--color-card))`);
    document.body.style.setProperty("--color-accent", color);
    $$(".dash-name").forEach(element => { element.textContent = name; });
    if ((location.pathname.replace(/\/$/, "") || "/") === "/dashboard") {
      const title = $("#main-content .dash-filters .page-title");
      if (title) title.textContent = name;
      document.title = name + " | Nemofy";
    }
  }
  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  function notify(message, kind = "info") {
    let region = $(".dashboard-toast-region");
    if (!region) { region = document.createElement("div"); region.className = "dashboard-toast-region"; region.setAttribute("aria-live", "polite"); document.body.append(region); }
    const toast = document.createElement("div"); toast.className = "dashboard-toast"; toast.dataset.kind = kind; toast.textContent = message; region.append(toast);
    setTimeout(() => toast.remove(), 3600);
  }
  function head(title, subtitle, tools = "") {
    return '<header class="page-top ar-page-top"><div><h1 class="page-title">' + title + '</h1><p class="page-subtitle">' + subtitle + '</p></div>' + tools + '</header>';
  }
  function demoNote(message) {
    return '<div class="ar-demo-note"><span class="ar-demo-dot"></span><span><strong>Ambiente de demonstra\u00e7\u00e3o</strong> \u00b7 ' + message + '</span></div>';
  }
  function card(title, body, tools = "") {
    return '<section class="card animate-in"><div class="card-top"><h2 class="card-title">' + title + '</h2>' + tools + '</div><div class="card-body">' + body + '</div></section>';
  }
  function svgIcon(name) {
    const paths = {
      search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
      eye: '<path d="M2.5 12s3.2-6 9.5-6 9.5 6 9.5 6-3.2 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/>',
      inbox: '<path d="M4 4.5h16l1.5 10v5H2.5v-5L4 4.5Z"/><path d="M3 14h5l1.5 2h5L16 14h5"/>',
      signal: '<path d="M3 12h3l2-7 4 14 2.5-9 2 4H21"/>',
      spark: '<path d="m12 2 1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7L12 2Z"/><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z"/>',
      people: '<circle cx="9" cy="8" r="3"/><path d="M3 20v-1.5A5.5 5.5 0 0 1 8.5 13h1A5.5 5.5 0 0 1 15 18.5V20M16 5.3a3 3 0 0 1 0 5.8M18 14a4.8 4.8 0 0 1 3 4.5V20"/>',
      webhook: '<path d="M8 8a4 4 0 1 1 6.9 2.8l-2.2 2.3M16 16a4 4 0 1 1-6.9-2.8l2.2-2.3M4.5 12h15"/>',
      mobile: '<rect x="6" y="2.5" width="12" height="19" rx="2"/><path d="M10 5h4M11 18.5h2"/>'
    };
    return '<svg class="ar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (paths[name] || paths.inbox) + '</svg>';
  }
  function emptyState(title, description, icon = "inbox") {
    return '<div class="empty-state"><span class="ar-empty-icon">' + svgIcon(icon) + '</span><h3>' + title + '</h3><p>' + description + '</p></div>';
  }
  function modal(id, title, content) {
    return '<div class="ar-modal" id="' + id + '" hidden><div class="ar-modal-box" role="dialog" aria-modal="true" aria-labelledby="' + id + '-title"><header><h2 id="' + id + '-title">' + title + '</h2><button type="button" class="ar-modal-close" data-modal-close aria-label="Fechar">×</button></header>' + content + '</div></div>';
  }
  function campaigns() {
    const state = read();
    const data = Array.isArray(state.campaigns) ? state.campaigns : [
      { status: "Ativa", name: "[ESCALA] Convers\u00e3o", channel: "Meta Ads", budget: "R$ 150,00/dia", spend: "R$ 962,35", sales: "90", roas: "2,5x" },
      { status: "Ativa", name: "Criativo UGC 04", channel: "Meta Ads", budget: "R$ 80,00/dia", spend: "R$ 418,20", sales: "38", roas: "1,9x" },
      { status: "Pausada", name: "Teste 02", channel: "TikTok Ads", budget: "R$ 60,00/dia", spend: "R$ 0,00", sales: "0", roas: "-" }
    ];
    if (!Array.isArray(state.campaigns)) save({ campaigns: data });
    const privacy = state.privacy === true;
    const rows = data.map((row, index) => `<tr data-filter-row data-campaign-row="${index}"><td><span class="ar-status ${row.status === "Ativa" ? "is-on" : "is-off"}">${esc(row.status)}</span></td><td><strong class="js-camp-name" data-sensitive>${privacy ? "••••••" : esc(row.name)}</strong></td><td>${esc(row.channel)}</td><td>${esc(row.budget)}</td><td>${esc(row.spend)}</td><td data-column="sales">${esc(row.sales)}</td><td data-column="roas">${esc(row.roas)}</td><td><div class="ar-row-actions"><button class="btn btn-sm btn-secondary" type="button" data-page-action="campaign-toggle" data-index="${index}">${row.status === "Ativa" ? "Pausar" : "Ativar"}</button><button class="btn btn-sm btn-secondary" type="button" data-page-action="campaign-duplicate" data-index="${index}">Duplicar</button></div></td></tr>`).join("");
    const tools = `<div class="ar-inline-tools"><button class="btn btn-sm btn-secondary" type="button" data-page-action="privacy" aria-label="Alternar privacidade">${svgIcon("eye")}</button><button class="btn btn-sm btn-secondary" type="button" data-page-action="campaign-columns" aria-pressed="${Boolean(state.campaignCompact)}">Colunas</button><button class="btn btn-sm btn-secondary" type="button" data-page-action="campaign-colors">Cor</button><button class="btn btn-sm btn-primary" type="button" data-page-action="campaign-refresh">Atualizar</button></div>`;
    const body = `<div class="ar-filter-bar"><label class="ar-search">${svgIcon("search")}<input type="search" data-module-search placeholder="Buscar por nome" aria-label="Buscar campanhas"></label><label class="ar-filter-label">Período<select class="form-input" data-period-filter><option>Hoje</option><option>Ontem</option><option>7 dias</option><option>15 dias</option><option>30 dias</option><option>Personalizado</option></select></label><button class="btn btn-sm btn-primary" type="button" data-page-action="campaign-add">Nova campanha</button><button class="btn btn-sm btn-secondary" type="button" data-demo-action="export-module">Exportar</button></div><div class="ar-table-scroll${state.campaignCompact ? " is-compact" : ""}"><div class="module-table-wrap"><table class="table ar-data-table"><thead><tr><th>Status</th><th>Campanha</th><th>Canal</th><th>Orçamento</th><th>Gasto</th><th data-column="sales">Vendas</th><th data-column="roas">ROAS</th><th>Ações</th></tr></thead><tbody>${rows}</tbody></table></div></div><div class="ar-table-foot"><span>${data.length} campanhas demonstrativas</span><button class="btn btn-sm btn-secondary" type="button" data-page-action="campaign-bulk">Pausar campanhas ativas</button></div>`;
    const create = modal("campaign-modal", "Nova campanha demonstrativa", '<form data-page-form="create-campaign"><label class="form-label">Nome<input class="form-input" name="campaignName" required maxlength="60" placeholder="Ex.: Campanha de conversão"></label><label class="form-label">Canal<select class="form-input" name="channel"><option>Meta Ads</option><option>TikTok Ads</option></select></label><label class="form-label">Orçamento diário<input class="form-input" name="budget" placeholder="R$ 0,00/dia"></label><footer><button type="button" class="btn btn-secondary" data-modal-close>Cancelar</button><button type="submit" class="btn btn-primary">Salvar localmente</button></footer></form>');
    return `<section class="module-screen ar-screen ar-campaign-screen" data-campaign-color="${Number(state.campaignColor || 0)}" aria-label="Campanhas">${head("Campanhas", "Acompanhe o desempenho e organize suas campanhas.", tools)}${demoNote("Os registros são locais; Meta Ads e TikTok Ads ainda não estão conectados.")}${card("Campanhas do período", body)}${create}</section>`;
  }
  function sales() {
    const initial = [
      ["AR-1008", "Cliente demo 01", "Kit Rotina Leve", "R$ 197,00", "Aprovada", "Meta Ads", "[ESCALA] Convers\u00e3o", "Hoje, 10:42"],
      ["AR-1007", "Cliente demo 02", "Método Essencial", "R$ 97,00", "Aprovada", "Meta Ads", "Criativo UGC 04", "Hoje, 09:18"],
      ["AR-1006", "Cliente demonstrativo", "Kit Rotina Leve", "R$ 197,00", "Pendente", "Sem origem", "-", "Ontem, 21:05"],
      ["AR-1005", "Cliente demo 03", "Método Essencial", "R$ 97,00", "Reembolsada", "TikTok Ads", "Teste 02", "Ontem, 18:27"],
      ["AR-1004", "Cliente demo 04", "Aula Intensiva", "R$ 47,00", "Aprovada", "Meta Ads", "[ESCALA] Convers\u00e3o", "17 nov, 13:11"]
    ];
    const state = read();
    const stored = Array.isArray(state.sales) ? state.sales : initial;
    const aliases = new Map([["Camila Oliveira", "Cliente demo 01"], ["Marcos Ribeiro", "Cliente demo 02"], ["Ana Martins", "Cliente demo 03"], ["João Souza", "Cliente demo 04"]]);
    const data = stored.map(row => aliases.has(row[1]) ? [row[0], aliases.get(row[1]), ...row.slice(2)] : row);
    if (!Array.isArray(state.sales) || data.some((row, index) => row[1] !== state.sales[index]?.[1])) save({ sales: data });
    const privacy = state.privacy === true;
    const rows = data.map((row, index) => `<tr data-filter-row data-sale-row="${index}"><td><strong>${esc(row[0])}</strong></td><td data-sensitive>${privacy ? "••••••" : esc(row[1])}</td><td class="js-product-name" data-sensitive>${privacy ? "••••••" : esc(row[2])}</td><td>${esc(row[3])}</td><td><span class="ar-state state-${row[4].toLowerCase()}">${esc(row[4])}</span></td><td>${esc(row[5])}</td><td class="js-camp-name" data-sensitive>${privacy ? "••••••" : esc(row[6])}</td><td>${esc(row[7])}</td><td><button class="btn btn-sm btn-secondary" type="button" data-page-action="sale-details" data-index="${index}">Detalhes</button></td></tr>`).join("");
    const tools = `<div class="ar-inline-tools"><button class="btn btn-sm btn-secondary" type="button" data-page-action="privacy" aria-label="Alternar privacidade">${svgIcon("eye")}</button><select class="form-input" data-status-filter aria-label="Filtrar status"><option value="">Todos os estados</option><option>Aprovada</option><option>Pendente</option><option>Reembolsada</option></select><select class="form-input" data-period-filter aria-label="Período"><option>7 dias</option><option>Hoje</option><option>Ontem</option><option>30 dias</option></select><button class="btn btn-sm btn-secondary" type="button" data-demo-action="export-module">Exportar CSV</button><button class="btn btn-sm btn-primary" type="button" data-page-action="sale-add">Simular venda</button></div>`;
    const body = `<label class="ar-search ar-sales-search">${svgIcon("search")}<input type="search" data-module-search placeholder="Buscar vendas..." aria-label="Buscar vendas"></label><div class="ar-table-scroll"><div class="module-table-wrap"><table class="table ar-data-table"><thead><tr><th>Pedido</th><th>Cliente</th><th>Produto</th><th>Valor</th><th>Estado</th><th>Origem</th><th>Campanha</th><th>Data</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></div><div class="ar-table-foot"><span>${data.length} pedidos demonstrativos</span></div>`;
    const details = modal("sale-details-modal", "Detalhes da venda", '<div class="ar-sale-detail-content"></div><footer><button type="button" class="btn btn-secondary" data-modal-close>Fechar</button></footer>');
    return `<section class="module-screen ar-screen" aria-label="Vendas">${head("Vendas", "Pedidos demonstrativos. Nenhum checkout está conectado.", tools)}${demoNote("Os nomes e pedidos são fictícios e ficam apenas neste navegador.")}${card("Vendas recentes", body)}${details}</section>`;
  }
  function visits() {
    const selected = read().visitFilter || "all";
    const filters = [["all", "Tudo"], ["visit", "Só visitou"], ["ic", "Checkout"], ["purchase", "Comprou"]];
    const chips = filters.map(([key, label]) => '<button type="button" class="btn btn-sm ' + (selected === key ? 'btn-primary' : 'btn-secondary') + '" aria-pressed="' + (selected === key) + '" data-visit-filter="' + key + '">' + label + '</button>').join("");
    const tools = '<div class="ar-inline-tools"><select class="form-input" data-source-filter aria-label="Origem"><option value="">Todas as origens</option><option>Meta Ads</option><option>TikTok Ads</option><option>Direto</option></select><div class="ar-filter-chips">' + chips + '</div><select class="form-input" data-period-filter aria-label="Período"><option>Hoje</option><option>Ontem</option><option>3 dias</option><option>7 dias</option></select></div>';
    const stats = '<div class="ar-kpi-grid"><article class="card ar-kpi"><div class="card-body"><span>Visitas</span><strong>0</strong><small>no período</small></div></article><article class="card ar-kpi"><div class="card-body"><span>Checkout (IC)</span><strong>0</strong><small>0% das visitas</small></div></article><article class="card ar-kpi"><div class="card-body"><span>Compras</span><strong>0</strong><small>0% dos checkouts</small></div></article></div>';
    return '<section class="module-screen ar-screen" aria-label="Visitas">' + head("Visitas", "Acompanhe o caminho dos visitantes até a compra.", tools) + demoNote("O pixel ainda não está conectado. Nenhuma visita real é coletada.") + stats + card("Atividade do período", emptyState("Nenhuma visita encontrada", "Os dados serão exibidos quando a integração do pixel estiver ativa.", "inbox")) + '</section>';
  }
  function rules() {
    const body = '<div class="ar-upgrade-state"><div class="ar-upgrade-icon">' + svgIcon("spark") + '</div><span class="ar-eyebrow">RECURSO DO PLANO PRO</span><h2>Automatize sua opera\u00e7\u00e3o</h2><p>Gerencie campanhas com regras inteligentes.<br>Dispon\u00edvel nos planos Pro e Scale.</p><a href="/plans" class="btn btn-primary">Fazer upgrade</a></div>';
    return '<section class="module-screen ar-screen" aria-label="Regras">' + head("Regras de Automa\u00e7\u00e3o", "Crie condi\u00e7\u00f5es para acompanhar suas campanhas.") + demoNote("As regras n\u00e3o executam a\u00e7\u00f5es em contas externas.") + '<section class="card ar-upgrade-card animate-in"><div class="card-body">' + body + '</div></section></section>';
  }
  const utm = "utm_source=FB&utm_campaign={{campaign.name}}|{{campaign.id}}&utm_medium={{adset.name}}|{{adset.id}}&utm_content={{ad.name}}|{{ad.id}}&utm_term={{placement}}";
  function integrationPanel(name, content) {
    return '<section class="ar-integration-panel" id="integration-panel-' + name + '" role="tabpanel" tabindex="0" aria-labelledby="integration-tab-' + name + '" data-integration-panel="' + name + '" ' + (name === "facebook" ? "" : "hidden") + '>' + content + '</section>';
  }
  function integrations() {
    const tabs = [["facebook", "Facebook Ads"], ["pixel", "Pixel de Rastreio"], ["utm", "UTMs"], ["webhook", "Webhook API"], ["app", "Baixe nosso App"], ["faq", "Dúvidas"]];
    const nav = '<div class="tabs ar-integration-tabs" role="tablist" aria-label="Seções de integrações">' + tabs.map((item, i) => '<button class="tab ' + (i === 0 ? "active" : "") + '" id="integration-tab-' + item[0] + '" type="button" role="tab" aria-controls="integration-panel-' + item[0] + '" aria-selected="' + (i === 0) + '" tabindex="' + (i === 0 ? '0' : '-1') + '" data-integration-tab="' + item[0] + '">' + item[1] + '</button>').join("") + '</div>';
    const facebook = card("Contas de Anúncio (0)", '<div class="ar-connect-empty">' + emptyState("Nenhuma conta conectada", "Conecte seu perfil do Facebook para ver suas contas de anúncio.", "inbox") + '</div>', '<button type="button" class="btn btn-primary" data-page-action="connect-meta">+ Conectar Conta</button>');
    const pixel = read().pixel || null;
    const pixelList = pixel
      ? '<div class="ar-pixel-row"><div><strong>' + esc(pixel.name) + '</strong><p>' + esc(pixel.domain || 'Sem domínio associado') + ' · Ambiente local</p></div><div class="ar-inline-tools"><span class="ar-status is-on">Demo</span><button type="button" class="btn btn-sm btn-secondary" data-page-action="pixel-edit">Editar</button><button type="button" class="btn btn-sm btn-secondary" data-page-action="pixel-remove">Excluir</button></div></div>'
      : emptyState("Nenhum pixel configurado", "Adicione um pixel para rastrear conversões e enviar dados via CAPI. O cadastro nesta versão é apenas demonstrativo.", "signal");
    const pixelBody = '<div class="ar-pixel-list" id="ar-pixel-list">' + pixelList + '</div>';
    const pixelCard = card("Pixels de Rastreio (" + (pixel ? '1/1' : '0/1') + ")", pixelBody, '<div class="ar-inline-tools"><button type="button" class="btn btn-sm btn-secondary" data-page-action="tutorial-pixel">▶ Tutorial</button><button type="button" class="btn btn-primary btn-sm" data-modal-open="pixel-modal"' + (pixel ? ' disabled' : '') + '>+ Novo Pixel</button></div>');
    const score = '<section class="card emq-card animate-in"><div class="card-body"><div class="emq-header"><div class="emq-badge" aria-hidden="true">9.1<span>/10</span></div><div class="emq-header-text"><span class="emq-tag">Prévia ilustrativa</span><h2 class="emq-title">Qualidade de correspondência do evento</h2><p class="emq-sub">Este indicador é apenas uma demonstração visual. O envio de eventos e a conexão com o CAPI ainda não estão ativos.</p></div></div><div class="emq-benefits"><article class="emq-benefit"><strong>Eventos server-side</strong><span>Preparado para uma futura conexão segura.</span></article><article class="emq-benefit"><strong>Correspondência de eventos</strong><span>Indicadores aparecerão quando houver dados reais.</span></article><article class="emq-benefit"><strong>Deduplicação</strong><span>Configuração disponível após ativar a integração.</span></article><article class="emq-benefit"><strong>Domínios autorizados</strong><span>Controles de domínio serão exibidos na configuração do pixel.</span></article></div></div></section>';
    const utmBody = '<div class="ar-utm-section"><h3>📌 O que são UTMs?</h3><p>UTMs são parâmetros adicionados à URL do anúncio para identificar a campanha, o conjunto de anúncios e o criativo associados a cada visita e venda.</p></div><div class="ar-utm-section"><h3>🚀 Como configurar</h3><ol><li>No Gerenciador de Anúncios, edite ou crie um anúncio.</li><li>Role até a seção “Rastreamento”.</li><li>No campo “Parâmetros de URL”, cole o valor abaixo.</li><li>Publique o anúncio normalmente.</li></ol></div><div class="ar-utm-section"><h3>📋 Parâmetros de URL</h3><p>Copie e cole no campo “Parâmetros de URL” do seu anúncio:</p><div class="ar-code-copy"><code id="ar-utm-string">' + esc(utm) + '</code><button type="button" class="btn btn-primary btn-sm" data-page-action="copy-utm">📋 Copiar</button></div></div><div class="ar-utm-table"><h3>💡 Entenda cada parâmetro</h3><div class="ar-table-scroll"><table class="table ar-data-table"><thead><tr><th>Parâmetro</th><th>Valor</th><th>O que captura</th></tr></thead><tbody><tr><td><code>utm_source</code></td><td><code>FB</code></td><td>Identifica que o tráfego vem do Facebook</td></tr><tr><td><code>utm_campaign</code></td><td><code>{{campaign.name}}|{{campaign.id}}</code></td><td>Nome e ID da campanha</td></tr><tr><td><code>utm_medium</code></td><td><code>{{adset.name}}|{{adset.id}}</code></td><td>Nome e ID do conjunto de anúncios</td></tr><tr><td><code>utm_content</code></td><td><code>{{ad.name}}|{{ad.id}}</code></td><td>Nome e ID do anúncio (criativo)</td></tr><tr><td><code>utm_term</code></td><td><code>{{placement}}</code></td><td>Posicionamento (Feed, Stories, Reels, etc.)</td></tr></tbody></table></div></div><div class="ar-utm-warning"><p><strong>⚠️ Importante:</strong> Os valores entre <code>{{ }}</code> são macros dinâmicas do Facebook e serão substituídos pelos dados do anúncio. Não altere os nomes dentro das chaves.</p></div>';
    const webhooksIntro = '<p class="ar-webhook-intro">Cada integração usa seu próprio token e URL. A geração de tokens e a conexão com plataformas serão habilitadas quando os serviços estiverem configurados.</p>';
    const webhooks = card("Tokens de API (0/2)", '<div class="ar-token-empty">' + emptyState("Nenhum token criado", "Tokens e URLs de webhook ainda não estão disponíveis nesta versão.", "webhook") + '</div>', '<div class="ar-inline-tools"><button type="button" class="btn btn-primary btn-sm" data-page-action="token-unavailable">+ Conectar Plataforma</button><button type="button" class="btn btn-secondary btn-sm" data-page-action="token-unavailable">+ Token Padrão</button></div>');
    const appBody = '<div class="ar-app-columns"><section><h3>Baixe o app</h3><p>Acompanhe suas métricas em tempo real direto do celular.</p><div class="ar-app-downloads"><button type="button" class="app-store-button" data-page-action="app-unavailable"> App Store</button><button type="button" class="android-button" data-page-action="app-unavailable">◆ Android APK</button></div><div class="ar-app-instructions"><strong>Como acessar:</strong><br>1. Baixe o app<br>2. Defina uma senha ao lado →<br>3. Entre com sua conta Nemofy e a senha definida.</div></section><section><h3>🔑 Definir senha do app</h3><p>Crie uma senha para acessar o app no celular.</p><label class="form-label">Senha<input class="form-input" type="password" disabled placeholder="Indisponível nesta demonstração"></label><label class="form-label">Confirmar senha<input class="form-input" type="password" disabled placeholder="Indisponível nesta demonstração"></label><button type="button" class="btn btn-primary" data-page-action="app-unavailable">🔑 Criar Senha</button></section></div>';
    const faqItemsLocal = [["Como cadastrar taxas da plataforma 🤔", "As taxas da plataforma podem ser configuradas quando os dados de vendas estiverem disponíveis."], ["Minhas vendas não estão marcando nas campanhas", "Confira os parâmetros UTM do anúncio e se o checkout preserva os parâmetros da URL."], ["Não está marcando IC", "Revise a regra de detecção do checkout configurada no pixel demonstrativo."], ["Como faço para entrar no app?", "O acesso ao aplicativo será liberado junto com a autenticação mobile."], ["Meu app não notificou a venda", "Notificações externas ainda não estão habilitadas nesta demonstração."], ["Como funciona a notificação de saldo baixo e limite de gastos?", "Os alertas dependem da conexão ativa com uma conta de anúncios."], ["Não está trackeando minhas vendas na Hotmart", "A integração com plataformas de venda ainda aguarda configuração."], ["A plataforma que uso para vender não está na lista de integrações", "A conexão por webhook será disponibilizada quando o serviço estiver ativo."]];
    const faq = '<div class="ar-faq-list">' + faqItemsLocal.map(item => '<details><summary><span>' + item[0] + '</span><span class="ar-faq-chevron" aria-hidden="true">⌄</span></summary><p>' + item[1] + '</p></details>').join("") + '</div>';
    const pixelModal = modal("pixel-modal", "Novo Pixel de Rastreio", '<form data-page-form="create-pixel"><label class="form-label">Nome do Pixel<input class="form-input" name="pixelName" required placeholder="Ex.: Pixel Produto X"></label><label class="form-label">Pixel ID<input class="form-input" disabled placeholder="Disponível quando a integração for ativada"></label><label class="form-label">Token CAPI<input class="form-input" type="password" disabled placeholder="Credenciais não são coletadas nesta demonstração"></label><div class="ar-pixel-rule-grid"><label class="form-label">Regra de Detecção IC<select class="form-input" disabled><option>Contém URL</option><option>Contém texto</option><option>Seletor CSS</option></select></label><label class="form-label">Valor da Regra<input class="form-input" disabled placeholder="Disponível após ativação"></label></div><label class="form-label">Domínios autorizados (opcional)<textarea class="form-input" name="domain" rows="2" placeholder="seudominio.com.br"></textarea><small>Um domínio por linha. O cadastro demonstrativo fica salvo somente neste navegador.</small></label><footer><button type="button" class="btn btn-secondary" data-modal-close>Cancelar</button><button type="submit" class="btn btn-primary">Criar Pixel demo</button></footer></form>');
    const connectModal = modal("meta-modal", "Conectar Meta Ads", '<div class="ar-modal-content"><p>Escolha como deseja conectar sua conta Meta Ads.</p><button type="button" class="btn btn-primary ar-connect-facebook" data-page-action="oauth-unavailable">f&nbsp; Conectar com Facebook</button><button type="button" class="btn btn-secondary ar-connect-facebook" data-page-action="oauth-unavailable">📋 Copiar link de conexão</button><small>A autenticação externa ainda não está ativa.</small></div>');
    const content = integrationPanel("facebook", facebook) + integrationPanel("pixel", pixelCard + score) + integrationPanel("utm", card("UTMs para Facebook Ads", utmBody, '<button type="button" class="btn btn-sm btn-secondary" data-page-action="tutorial-utm">▶ Tutorial</button>')) + integrationPanel("webhook", '<div class="ar-webhook-stack">' + card("Webhook API", webhooksIntro, '<button type="button" class="btn btn-sm btn-secondary" data-page-action="webhook-docs">Documentação</button>') + webhooks + '</div>') + integrationPanel("app", card("📱 App Nemofy", appBody, '<span class="badge badge-paused">Senha ⚠️ Não definida</span>')) + integrationPanel("faq", faq);
    return '<section class="module-screen ar-screen ar-integrations" aria-label="Integrações">' + head("Integrações", "Conecte suas contas de anúncios e configure o rastreamento") + nav + content + pixelModal + connectModal + '</section>';
  }
  function notifications() {
    const saleOptions = [
      ["sale_approved", "Vendas aprovadas", true, ""],
      ["sale_pending", "Vendas pendentes", false, ""],
      ["sale_refunded", "Vendas reembolsadas", false, ""],
      ["hide_product_name", "Ocultar nome do produto", false, 'Ex: "Venda Aprovada! Valor: R$ 14,00"'],
      ["show_campaign_name", "Mostrar nome da campanha", false, 'Ex: "Venda Aprovada! Valor: R$ 14,00 — Campanha: [ESCALA] BF Criativo 03"'],
      ["show_dashboard_name", "Mostrar nome do dashboard no título", false, 'Essencial pra quem roda ofertas simultâneas. Ex: "[Emagrecimento] Venda Aprovada!"'],
      ["notify_gross_value", "Mostrar valor bruto (sem descontar taxas)", false, "Por padrão a notificação mostra o valor líquido. Ligue pra receber o valor cheio da venda."]
    ];
    const reports = [["report_08", "Notificação das 08:00"], ["report_12", "Notificação das 12:00"], ["report_18", "Notificação das 18:00"], ["report_23", "Notificação das 23:00"]];
    const toggle = (id, name, defaultOn, test, description) => {
      const saved = read().toggles || {};
      const checked = Object.prototype.hasOwnProperty.call(saved, id) ? saved[id] : defaultOn;
      return '<div class="toggle-item"><span>' + name + (description ? '<small>' + description + '</small>' : '') + '</span><div class="ar-toggle-actions">' + (test ? '<button type="button" class="btn-test-push" data-page-action="test-notification" data-notification-kind="' + id.replace("notification-", "") + '" title="Enviar notificação de teste">🔔 Testar</button>' : '') + '<label class="switch"><input type="checkbox" data-page-toggle="' + id + '" aria-label="' + name + '"' + (checked ? ' checked' : '') + '><span class="switch-slider"></span></label></div></div>';
    };
    const salesBody = '<p class="ar-muted-intro">Seja notificado no app sempre que for realizada uma nova venda:</p><div class="toggle-group">' + saleOptions.map(item => toggle("notification-" + item[0], item[1], item[2], item[0].startsWith("sale_"), item[3])).join("") + '</div>';
    const reportsBody = '<p class="ar-muted-intro">Configure as notificações de relatório que quer visualizar:</p><h3 class="ar-small-heading">Horários</h3><div class="toggle-group">' + reports.map(item => toggle("notification-" + item[0], item[1], false, false, "")).join("") + '</div>';
    const accountBody = '<p class="ar-muted-intro">Configure um valor de alerta por conta. <strong>Pré-pago:</strong> avisa quando o saldo ficar abaixo do valor. <strong>Cartão (pós-pago):</strong> avisa quando faltar pouco para a Meta cobrar no cartão.</p><p class="ar-notification-empty">Nenhuma conta de anúncio ativa neste dashboard.</p>';
    return '<section class="module-screen ar-screen ar-notifications" aria-label="Notificações">' + head("Notificações", "Configure quais notificações deseja receber") + '<div class="ar-notification-grid">' + card("Notificações de Venda", salesBody) + card("Notificações de Relatório", reportsBody) + '<div class="ar-span-all">' + card("Alertas de Conta", accountBody) + '</div></div></section>';
  }
  function account() {
    const state = read();
    const timezone = state.timezone || "America/Sao_Paulo";
    const zones = ["America/Sao_Paulo", "America/Manaus", "America/Rio_Branco", "America/Noronha", "UTC"];
    const profile = '<div class="ar-profile"><div class="ar-avatar">AR</div><div><h3>Conta de demonstra\u00e7\u00e3o</h3><p>Perfil local do Nemofy</p></div></div><div class="form-group"><label class="form-label">Plano atual</label><div><span class="badge badge-active">TRIAL</span> <a href="/plans" class="ar-inline-link">Ver planos</a></div></div><div class="form-group"><label class="form-label">Teste expira em</label><p>26/11/2026</p></div><div class="form-group"><label class="form-label">Membro desde</label><p>19/11/2026</p></div>';
    const limits = [["Dashboards", "1 / 1", 100], ["Tokens de API", "0 / 2", 0], ["Contas de An\u00fancio", "0 / 1", 0], ["Pixels", "0 / 1", 0]];
    const limitsBody = limits.map(item => '<div class="ar-limit"><div><span>' + item[0] + '</span><strong>' + item[1] + '</strong></div><div class="ar-limit-track"><span style="width:' + item[2] + '%"></span></div></div>').join("");
    const mobile = '<p class="ar-muted-intro">A senha mobile estar\u00e1 dispon\u00edvel quando a autentica\u00e7\u00e3o do aplicativo for configurada.</p><div class="ar-password-form"><label class="form-label">Senha<input class="form-input" type="password" disabled placeholder="Indispon\u00edvel na demonstra\u00e7\u00e3o"></label><label class="form-label">Confirmar senha<input class="form-input" type="password" disabled placeholder="Indispon\u00edvel na demonstra\u00e7\u00e3o"></label><button class="btn btn-primary" type="button" data-page-action="password-unavailable">Criar senha</button></div>';
    const timezoneForm = '<form class="ar-timezone-form" data-page-form="timezone"><label class="form-label">Fuso hor\u00e1rio (s\u00f3 muda a hora mostrada)<select class="form-input" name="timezone">' + zones.map(zone => '<option value="' + zone + '"' + (zone === timezone ? ' selected' : '') + '>' + zone + '</option>').join("") + '</select></label><button type="submit" class="btn btn-secondary">Salvar</button></form>';
    return '<section class="module-screen ar-screen" aria-label="Minha Conta">' + head("Minha Conta", "Gerencie as prefer\u00eancias da conta local.") + demoNote("Esta conta n\u00e3o tem perfil pessoal, credenciais ou dados externos vinculados.") + '<div class="ar-account-grid">' + card("Perfil", profile + timezoneForm) + card("Limites do Plano", limitsBody) + '<div class="ar-span-all">' + card("Senha do App Mobile", mobile) + '</div></div></section>';
  }
  function settings() {
    const state = read();
    const dashName = state.dashboardName || "Dashboard Principal";
    const color = state.dashboardColor || "#1A6DFF";
    const dashRow = '<tr><td><button class="ar-color-dot" type="button" style="--swatch:' + esc(color) + '" data-page-action="choose-dashboard-color" aria-label="Personalizar cor"></button></td><td><strong id="ar-dashboard-name">' + esc(dashName) + '</strong></td><td><span class="badge badge-active">Principal</span></td><td>19/11/2026</td><td><button type="button" class="btn btn-sm btn-secondary" data-modal-open="rename-modal">Renomear</button></td></tr>';
    const dashboards = '<div class="ar-table-scroll"><div class="module-table-wrap"><table class="table ar-data-table"><thead><tr><th>Cor</th><th>Nome</th><th>Tipo</th><th>Criado em</th><th>A\u00e7\u00f5es</th></tr></thead><tbody>' + dashRow + '</tbody></table></div></div>';
    const collaborators = '<p class="ar-muted-intro">A gest\u00e3o de acesso de colaboradores ser\u00e1 liberada junto com login e controle de permiss\u00f5es.</p>' + emptyState("Nenhum colaborador", "Convites e permiss\u00f5es n\u00e3o est\u00e3o ativos nesta demonstra\u00e7\u00e3o.", "people") + '<button type="button" class="btn btn-secondary" data-page-action="collaborator-unavailable">+ Novo Colaborador</button>';
    const rename = modal("rename-modal", "Renomear Dashboard", '<form data-page-form="rename-dashboard"><label class="form-label">Novo nome<input class="form-input" name="dashboardName" maxlength="48" required value="' + esc(dashName) + '"></label><footer><button type="button" class="btn btn-secondary" data-modal-close>Cancelar</button><button type="submit" class="btn btn-primary">Salvar</button></footer></form>');
    const colors = modal("color-modal", "Cor do Dashboard", '<div class="ar-color-options"><button type="button" style="--swatch:#1A6DFF" data-page-action="set-dashboard-color" data-color="#1A6DFF" aria-label="Azul"></button><button type="button" style="--swatch:#10B981" data-page-action="set-dashboard-color" data-color="#10B981" aria-label="Verde"></button><button type="button" style="--swatch:#8B5CF6" data-page-action="set-dashboard-color" data-color="#8B5CF6" aria-label="Roxo"></button><button type="button" style="--swatch:#F59E0B" data-page-action="set-dashboard-color" data-color="#F59E0B" aria-label="Âmbar"></button></div><label class="form-label">Cor personalizada<input class="form-input" type="color" value="' + esc(color) + '" data-custom-color></label><footer><button type="button" class="btn btn-secondary" data-modal-close>Fechar</button><button type="button" class="btn btn-primary" data-page-action="set-custom-color">Aplicar</button></footer>');
    const preferences = '<div class="ar-settings-row"><div><strong>Tema do painel</strong><p>Alterna entre claro e escuro neste navegador.</p></div><button class="btn btn-sm btn-secondary" type="button" data-page-action="toggle-theme">Alternar tema</button></div><div class="ar-settings-row"><div><strong>Dados demonstrativos</strong><p>Restaura as prefer\u00eancias locais desta tela.</p></div><button class="btn btn-sm btn-secondary" type="button" data-page-action="reset-demo">Restaurar dados</button></div>';
    return '<section class="module-screen ar-screen" aria-label="Configura\u00e7\u00f5es">' + head("Configura\u00e7\u00f5es", "Gerencie dashboards e prefer\u00eancias do workspace.") + demoNote("As altera\u00e7\u00f5es ficam neste navegador. N\u00e3o h\u00e1 equipes ou servi\u00e7os externos conectados.") + card("Dashboards (1/1)", dashboards, '<a href="/plans" class="btn btn-sm btn-secondary">Ver planos</a>') + '<div class="ar-settings-grid">' + card("Colaboradores (0/0)", collaborators) + card("Prefer\u00eancias locais", preferences) + '</div>' + rename + colors + '</section>';
  }
  function render(pathname) {
    if (pathname === "/campaigns") return campaigns();
    if (pathname === "/sales") return sales();
    if (pathname === "/visits") return visits();
    if (pathname === "/rules") return rules();
    if (pathname === "/integrations") return integrations();
    if (pathname === "/notifications") return notifications();
    if (pathname === "/account") return account();
    if (pathname === "/settings") return settings();
    return null;
  }
  let lastFocus = null;
  function openModal(id) {
    const node = document.getElementById(id);
    if (!node) return;
    lastFocus = document.activeElement;
    if (node.parentElement !== document.body) document.body.append(node);
    node.hidden = false;
    document.body.classList.add('ar-modal-open');
    requestAnimationFrame(() => node.querySelector('input:not([disabled]),select,button')?.focus());
  }
  function closeModal(target) {
    const node = target?.closest?.('.ar-modal') || target;
    if (node?.classList?.contains('ar-modal')) node.hidden = true;
    if (!$('.ar-modal:not([hidden])')) document.body.classList.remove('ar-modal-open');
    lastFocus?.focus?.();
  }
  function renderCurrent() {
    const main = $('#main-content');
    const markup = render(location.pathname.replace(/\/$/, '') || '/');
    if (!main || !markup) return;
    $$('.ar-modal').forEach(node => node.remove());
    document.body.classList.remove('ar-modal-open');
    main.innerHTML = markup;
    const title = $('.page-title', main)?.textContent;
    if (title) document.title = title + ' | Nemofy';
    applyDashboardPreferences();
    document.dispatchEvent(new Event('lt:content-loaded'));
  }
  function applyFilters() {
    const query = $('[data-module-search]')?.value.trim().toLocaleLowerCase('pt-BR') || '';
    const status = $('[data-status-filter]')?.value || '';
    const source = $('[data-source-filter]')?.value || '';
    const period = $('[data-period-filter]')?.value || '';
    let shown = 0;
    $$('.module-table-wrap tbody tr[data-filter-row]').forEach(row => {
      const cells = [...row.cells];
      const textMatch = !query || row.textContent.toLocaleLowerCase('pt-BR').includes(query);
      const statusMatch = !status || cells[4]?.textContent.trim() === status;
      const sourceMatch = !source || cells[5]?.textContent.trim() === source;
      const date = cells[7]?.textContent.trim() || '';
      const periodMatch = !period || period === '7 dias' || period === '15 dias' || period === '30 dias' || period === 'Personalizado' || (period === 'Hoje' ? date.startsWith('Hoje') : period === 'Ontem' ? date.startsWith('Ontem') : true);
      row.hidden = !(textMatch && statusMatch && sourceMatch && periodMatch);
      if (!row.hidden) shown++;
    });
    const count = $('[data-sales-count]');
    if (count) count.textContent = shown + ' pedidos demonstrativos';
  }
  function saveToggle(input) {
    const key = input.dataset.pageToggle;
    if (!key) return;
    const toggles = { ...(read().toggles || {}), [key]: input.checked };
    save({ toggles });
    notify('Preferência salva neste navegador.', 'success');
  }
  function setDashboardColor(value) {
    if (!/^#[0-9a-f]{6}$/i.test(value || '')) return;
    save({ dashboardColor: value });
    renderCurrent();
    notify('Cor do dashboard atualizada.', 'success');
  }
  async function copyUtm() {
    try {
      await navigator.clipboard.writeText(utm);
      notify('Parâmetros UTM copiados.', 'success');
    } catch {
      const field = document.createElement('textarea');
      field.value = utm;
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.append(field);
      field.select();
      const copied = document.execCommand('copy');
      field.remove();
      notify(copied ? 'Parâmetros UTM copiados.' : 'Selecione e copie os parâmetros manualmente.', copied ? 'success' : 'error');
    }
  }
  function applyPrivacy() {
    save({ privacy: !read().privacy });
    renderCurrent();
    notify(read().privacy ? 'Informações sensíveis ocultas.' : 'Informações demonstrativas visíveis.', 'success');
  }
  document.addEventListener('click', event => {
    const open = event.target.closest('[data-modal-open]');
    if (open) {
      const id = open.dataset.modalOpen;
      openModal(id);
      if (id === 'pixel-modal') {
        const form = $('[data-page-form="create-pixel"]');
        if (form) {
          form.dataset.editing = 'false';
          form.elements.pixelName.value = '';
          form.elements.domain.value = '';
        }
      }
      return;
    }
    const close = event.target.closest('[data-modal-close]');
    if (close) { closeModal(close); return; }
    if (event.target.classList?.contains('ar-modal')) { closeModal(event.target); return; }

    const tab = event.target.closest('[data-integration-tab]');
    if (tab) {
      const key = tab.dataset.integrationTab;
      $$('[data-integration-tab]').forEach(item => {
        const selected = item === tab;
        item.classList.toggle('active', selected);
        item.setAttribute('aria-selected', String(selected));
        item.tabIndex = selected ? 0 : -1;
      });
      $$('[data-integration-panel]').forEach(panel => {
        const selected = panel.dataset.integrationPanel === key;
        panel.hidden = !selected;
        if (selected) {
          panel.classList.remove('lt-tab-in');
          void panel.offsetWidth;
          panel.classList.add('lt-tab-in');
          window.setTimeout(() => panel.classList.remove('lt-tab-in'), 180);
        }
      });
      return;
    }

    const visitFilter = event.target.closest('[data-visit-filter]');
    if (visitFilter) {
      $$('[data-visit-filter]').forEach(button => {
        const selected = button === visitFilter;
        button.classList.toggle('btn-primary', selected);
        button.classList.toggle('btn-secondary', !selected);
        button.setAttribute('aria-pressed', String(selected));
      });
      save({ visitFilter: visitFilter.dataset.visitFilter });
      return;
    }

    const action = event.target.closest('[data-page-action]');
    if (!action) return;
    const name = action.dataset.pageAction;
    const state = read();
    if (name === 'privacy') { applyPrivacy(); return; }
    if (name === 'campaign-refresh') { notify('A lista demonstrativa já está atualizada.', 'success'); return; }
    if (name === 'campaign-add') { openModal('campaign-modal'); return; }
    if (name === 'campaign-columns') { save({ campaignCompact: !state.campaignCompact }); renderCurrent(); return; }
    if (name === 'campaign-colors') { save({ campaignColor: (Number(state.campaignColor || 0) + 1) % 3 }); renderCurrent(); return; }
    if (name === 'campaign-toggle') {
      const list = [...(state.campaigns || [])];
      const row = list[Number(action.dataset.index)];
      if (!row) return;
      row.status = row.status === 'Ativa' ? 'Pausada' : 'Ativa';
      save({ campaigns: list }); renderCurrent(); notify('Status da campanha atualizado localmente.', 'success'); return;
    }
    if (name === 'campaign-duplicate') {
      const list = [...(state.campaigns || [])];
      const row = list[Number(action.dataset.index)];
      if (!row) return;
      list.push({ ...row, name: row.name + ' (cópia)', status: 'Pausada', sales: '0', roas: '-' });
      save({ campaigns: list }); renderCurrent(); notify('Cópia demonstrativa criada.', 'success'); return;
    }
    if (name === 'campaign-bulk') {
      const list = (state.campaigns || []).map(row => ({ ...row, status: 'Pausada' }));
      save({ campaigns: list }); renderCurrent(); notify('Campanhas demonstrativas pausadas.', 'success'); return;
    }
    if (name === 'sale-add') {
      const list = [...(state.sales || [])];
      list.unshift(['AR-' + (1009 + list.length), 'Cliente demonstrativo', 'Venda demonstrativa', 'R$ 47,00', 'Pendente', 'Sem origem', '-', 'Agora']);
      save({ sales: list }); renderCurrent(); notify('Venda adicionada somente a esta demonstração.', 'success'); return;
    }
    if (name === 'sale-details') {
      const row = (state.sales || [])[Number(action.dataset.index)];
      if (!row) return;
      const labels = ['Pedido', 'Cliente', 'Produto', 'Valor', 'Estado', 'Origem', 'Campanha', 'Data'];
      const content = $('.ar-sale-detail-content');
      if (content) content.innerHTML = row.map((value, index) => '<div><small>' + labels[index] + '</small><strong>' + esc(state.privacy && [1, 2, 6].includes(index) ? '••••••' : value) + '</strong></div>').join('');
      openModal('sale-details-modal'); return;
    }
    if (name === 'connect-meta') { openModal('meta-modal'); return; }
    if (name === 'oauth-unavailable') { notify('A conexão com a Meta ainda não foi ativada.'); return; }
    if (name === 'tutorial-pixel' || name === 'tutorial-utm') { notify('O tutorial estará disponível quando a integração for ativada.'); return; }
    if (name === 'webhook-docs') { notify('A documentação da API ainda não está disponível nesta versão.'); return; }
    if (name === 'pixel-test') { notify('Pixel de demonstração: nenhum evento externo foi enviado.'); return; }
    if (name === 'pixel-edit') {
      const form = $('[data-page-form="create-pixel"]');
      if (form) {
        form.dataset.editing = 'true';
        form.elements.pixelName.value = state.pixel?.name || '';
        form.elements.domain.value = state.pixel?.domain || '';
        const title = $('#pixel-modal-title'); if (title) title.textContent = 'Editar Pixel de Rastreio';
        const submit = form.querySelector('[type="submit"]'); if (submit) submit.textContent = 'Salvar localmente';
        openModal('pixel-modal');
      }
      return;
    }
    if (name === 'pixel-remove') { save({ pixel: null }); renderCurrent(); notify('Pixel demonstrativo removido.'); return; }
    if (name === 'token-unavailable') { notify('Tokens e webhooks externos aguardam a configuração do serviço.'); return; }
    if (name === 'app-unavailable') { notify('O aplicativo Nemofy ainda não está disponível para download.'); return; }
    if (name === 'copy-utm') { copyUtm(); return; }
    if (name === 'test-notification') {
      const kind = action.dataset.notificationKind || 'sale_approved';
      const labels = { sale_approved: 'venda aprovada', sale_pending: 'venda pendente', sale_refunded: 'venda reembolsada' };
      const original = action.innerHTML;
      action.disabled = true;
      action.textContent = '⏳ Enviando...';
      notify('Teste local de notificação: ' + (labels[kind] || 'venda') + '. Nenhuma mensagem foi enviada para fora.', 'success');
      window.setTimeout(() => { action.disabled = false; action.innerHTML = original; }, 900);
      return;
    }
    if (name === 'password-unavailable') { notify('A autenticação do aplicativo ainda não foi configurada.'); return; }
    if (name === 'collaborator-unavailable') { notify('Convites de equipe aguardam a configuração de acesso.'); return; }
    if (name === 'toggle-theme') { window.toggleTheme?.(); notify('Tema atualizado neste navegador.', 'success'); return; }
    if (name === 'reset-demo') {
      try { localStorage.removeItem(STATE_KEY); } catch {}
      renderCurrent(); notify('Preferências demonstrativas restauradas.', 'success'); return;
    }
    if (name === 'choose-dashboard-color') { openModal('color-modal'); return; }
    if (name === 'set-dashboard-color') { setDashboardColor(action.dataset.color); return; }
    if (name === 'set-custom-color') { setDashboardColor($('[data-custom-color]')?.value); closeModal(action); return; }
  });
  document.addEventListener('input', event => {
    if (event.target.matches('[data-module-search]')) applyFilters();
  });
  document.addEventListener('change', event => {
    if (event.target.matches('[data-page-toggle]')) saveToggle(event.target);
    if (event.target.matches('[data-status-filter], [data-source-filter], [data-period-filter]')) applyFilters();
    if (event.target.matches('[data-custom-color]')) event.target.dataset.pending = 'true';
  });
  document.addEventListener('submit', event => {
    const form = event.target.closest('[data-page-form]');
    if (!form) return;
    event.preventDefault();
    const state = read();
    if (form.dataset.pageForm === 'create-campaign') {
      const list = [...(state.campaigns || [])];
      list.unshift({ status: 'Pausada', name: form.elements.campaignName.value.trim(), channel: form.elements.channel.value, budget: form.elements.budget.value.trim() || 'Não definido', spend: 'R$ 0,00', sales: '0', roas: '-' });
      save({ campaigns: list }); renderCurrent(); notify('Campanha demonstrativa salva localmente.', 'success'); return;
    }
    if (form.dataset.pageForm === 'create-pixel') {
      const name = form.elements.pixelName.value.trim();
      const domain = form.elements.domain.value.trim().replace(/^https?:\/\//i, '').replace(/\/$/, '');
      if (!name) return;
      save({ pixel: { name, domain } }); renderCurrent(); notify('Pixel demonstrativo salvo. Nenhuma conexão foi criada.', 'success'); return;
    }
    if (form.dataset.pageForm === 'timezone') {
      save({ timezone: form.elements.timezone.value }); notify('Fuso horário salvo neste navegador.', 'success'); return;
    }
    if (form.dataset.pageForm === 'rename-dashboard') {
      save({ dashboardName: form.elements.dashboardName.value.trim() }); renderCurrent(); notify('Nome do dashboard atualizado.', 'success'); return;
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      const shown = $('.ar-modal:not([hidden])');
      if (shown) closeModal(shown);
    }
    const active = event.target.closest?.('[data-integration-tab]');
    if (active && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
      const tabs = $$('[data-integration-tab]');
      const index = tabs.indexOf(active);
      const next = tabs[(index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      next.focus(); next.click();
    }
  });
  window.AnalisaScreens = { render, applyDashboardPreferences };
})();
