(() => {
  "use strict";

  const DEMO_KEY = "analisa-roi.dashboard.demo.v1";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const readState = () => {
    try { return JSON.parse(localStorage.getItem(DEMO_KEY) || "{}"); }
    catch { return {}; }
  };
  const writeState = (updates) => {
    try { localStorage.setItem(DEMO_KEY, JSON.stringify({ ...readState(), ...updates })); }
    catch { showToast("O navegador não permitiu salvar esta preferência.", "error"); }
  };

  function showToast(message, kind = "info") {
    let region = $(".dashboard-toast-region");
    if (!region) {
      region = document.createElement("div");
      region.className = "dashboard-toast-region";
      region.setAttribute("aria-live", "polite");
      region.setAttribute("aria-atomic", "false");
      document.body.append(region);
    }
    const toast = document.createElement("div");
    toast.className = "dashboard-toast";
    toast.dataset.kind = kind;
    toast.textContent = message;
    region.append(toast);
    window.setTimeout(() => toast.remove(), 3600);
  }

  async function syncBackendAccessStatus() {
    const daysLabel = $("[data-trial-days]");
    if (!daysLabel) return;
    try {
      const configResponse = await fetch("/api/auth/config", { credentials: "same-origin" });
      if (!configResponse.ok) return;
      const config = await configResponse.json();
      if (config.demoMode || !config.authConfigured) return;
      const response = await fetch("/api/auth/session", { credentials: "same-origin", cache: "no-store" });
      if (response.status === 401) return location.replace("/login");
      if (response.status === 403) return location.replace("/plans?reason=trial_expired");
      if (!response.ok) return;
      const session = await response.json();
      const entitlement = session.entitlement;
      if (!entitlement) return;
      const planNames = { trial: "Trial", basic: "Basic", pro: "Pro", scale: "Scale" };
      const planName = planNames[entitlement.plan] || "Plano";
      $(".sb-plan-name")?.replaceChildren(document.createTextNode(planName));
      $(".sb-user-role")?.replaceChildren(document.createTextNode(planName));
      daysLabel.textContent = entitlement.status === "trialing"
        ? `${entitlement.daysRemaining} ${entitlement.daysRemaining === 1 ? "dia" : "dias"}`
        : "Ativo";
    } catch {
      // A autorização continua sendo conferida pelo servidor em cada rota/API.
    }
  }

  function scheduleAccessRecheck() {
    void syncBackendAccessStatus();
    window.setInterval(syncBackendAccessStatus, 60_000);
  }

  function toggleMenu() {
    const sidebar = $("#sidebar");
    const overlay = $("#sidebar-overlay");
    if (!sidebar) return;
    const open = sidebar.classList.toggle("open");
    overlay?.classList.toggle("active", open);
    document.body.style.overflow = open ? "hidden" : "";
    $(".mobile-hamburger")?.setAttribute("aria-expanded", String(open));
  }

  function toggleTheme() {
    const next = document.body.dataset.theme === "dark" ? "light" : "dark";
    document.body.dataset.theme = next;
    writeState({ theme: next });
    updateThemeUI();
  }

  function updateThemeUI() {
    const dark = document.body.dataset.theme === "dark";
    const setVisible = (selector, visible) => {
      $$(selector).forEach(el => { el.style.display = visible ? "" : "none"; });
    };
    setVisible("#icon-sun, .collapsed-sun", dark);
    setVisible("#icon-moon, .collapsed-moon", !dark);
  }

  function toggleSidebarCollapse() {
    const sidebar = $("#sidebar");
    const layout = $(".layout");
    if (!sidebar) return;
    const collapsed = sidebar.classList.toggle("collapsed");
    layout?.classList.toggle("sidebar-collapsed", collapsed);
    writeState({ sidebarCollapsed: collapsed });
  }

  function toggleDashDropdown() {
    const submenu = $("#dash-submenu");
    if (!submenu) return;
    const open = getComputedStyle(submenu).display === "none";
    submenu.style.display = open ? "block" : "none";
    $("#dash-chevron")?.classList.toggle("rotated", !open);
  }

  function toggleDashPages(id) {
    const pages = $(`#dash-pages-${id}`);
    if (!pages) return;
    const open = getComputedStyle(pages).display === "none";
    pages.style.display = open ? "flex" : "none";
    $(`#dash-chev-${id}`)?.classList.toggle("rotated", !open);
  }

  function setRouteActive() {
    const route = window.location.pathname.replace(/\/$/, "") || "/";
    $$(".sidebar-nav a[href]").forEach(link => {
      const path = new URL(link.href, location.origin).pathname.replace(/\/$/, "") || "/";
      link.classList.toggle("active", path === route);
    });
  }

  function changePeriod(period, silent = false) {
    $$("[data-period]").forEach(button => {
      const active = button.dataset.period === String(period);
      button.classList.toggle("btn-primary", active);
      button.classList.toggle("btn-secondary", !active);
      button.setAttribute("aria-pressed", String(active));
    });
    const url = new URL(location.href);
    url.searchParams.set("period", period);
    history.replaceState(null, "", url.pathname + url.search + url.hash);
    writeState({ period: String(period) });
    if (!silent) showToast("Período atualizado. Os valores continuam demonstrativos.");
  }

  function toggleDatePicker(event) {
    event?.stopPropagation();
    const pop = $("#date-picker-pop");
    const exportPop = $("#dash-export-pop");
    if (!pop) return;
    if (exportPop) exportPop.style.display = "none";
    pop.style.display = pop.style.display === "none" ? "block" : "none";
    if (pop.style.display === "block") $("input[type=date]", pop)?.focus();
  }

  function closeDatePicker() {
    const pop = $("#date-picker-pop");
    if (pop) pop.style.display = "none";
  }

  function applyDateFilter() {
    const from = $("#local-date-from")?.value || "";
    const to = $("#local-date-to")?.value || "";
    if (!from || !to) {
      showToast("Escolha as datas inicial e final.", "error");
      return;
    }
    if (from > to) {
      showToast("A data inicial precisa ser anterior à data final.", "error");
      return;
    }
    $("#date_from").value = from;
    $("#date_to").value = to;
    const format = value => new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
    const label = $("#date-picker-label");
    if (label) label.textContent = `${format(from)} – ${format(to)}`;
    const url = new URL(location.href);
    url.searchParams.set("from", from);
    url.searchParams.set("to", to);
    url.searchParams.delete("period");
    history.replaceState(null, "", url.pathname + url.search + url.hash);
    writeState({ dateFrom: from, dateTo: to });
    closeDatePicker();
    showToast("Intervalo aplicado aos dados demonstrativos.", "success");
  }

  function refreshDashboardWithSync() {
    const button = $("#btn-dash-refresh");
    const icon = $("#dash-refresh-icon");
    const label = $("#dash-refresh-label");
    if (button?.disabled) return;
    if (button) button.disabled = true;
    if (icon) icon.classList.add("is-spinning");
    if (label) label.textContent = "Atualizando";
    window.setTimeout(() => {
      if (button) button.disabled = false;
      if (icon) icon.classList.remove("is-spinning");
      if (label) label.textContent = "Atualizar";
      showToast("Painel atualizado com a demonstração local.", "success");
    }, 650);
  }

  function dashToggleExport(event) {
    event?.stopPropagation();
    const pop = $("#dash-export-pop");
    const datePop = $("#date-picker-pop");
    if (!pop) return;
    if (datePop) datePop.style.display = "none";
    pop.style.display = pop.style.display === "none" ? "block" : "none";
  }

  function downloadLocalExport(format) {
    const cards = $$("#dash-sections [data-card]").filter(card => card.style.display !== "none");
    const rows = [["Métrica", "Valor"]];
    cards.forEach(card => {
      const label = card.dataset.label || card.dataset.card;
      const value = $(".kpi-value, .fx3-pct, .approval-rate", card)?.textContent?.trim() || "—";
      rows.push([label, value]);
    });
    if (rows.length === 1) {
      showToast("Não há métricas nesta tela para exportar.", "error");
      return;
    }
    const csv = "\uFEFF" + rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(";")).join("\r\n");
    const content = format === "xls"
      ? `<html><head><meta charset="utf-8"></head><body><table>${rows.map(row => `<tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</table></body></html>`
      : csv;
    const blob = new Blob([content], { type: format === "xls" ? "application/vnd.ms-excel;charset=utf-8" : "text/csv;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = `analisa-roi-demonstracao.${format === "xls" ? "xls" : "csv"}`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(href);
    const pop = $("#dash-export-pop");
    if (pop) pop.style.display = "none";
    showToast("Arquivo CSV exportado do navegador.", "success");
  }

  function togglePrivacyMode() {
    const on = readState().privacy !== true;
    writeState({ privacy: on });
    $$(".js-product-name, .js-camp-name, .js-ad-account-id, [data-privacy]").forEach(element => {
      if (!element.dataset.originalText) element.dataset.originalText = element.textContent;
      element.textContent = on ? "••••••••" : element.dataset.originalText;
    });
    const eye = $("#privacy-icon-on");
    const hidden = $("#privacy-icon-off");
    if (eye) eye.style.display = on ? "none" : "";
    if (hidden) hidden.style.display = on ? "" : "none";
    $("#btn-privacy-toggle")?.classList.toggle("btn-primary", on);
    showToast(on ? "Modo de privacidade ativado." : "Modo de privacidade desativado.");
  }

  let editSnapshot = null;
  function currentLayout() {
    return $$("#dash-sections > [data-card]").map(card => ({ key: card.dataset.card, hidden: card.style.display === "none" }));
  }

  function applyLayout(layout) {
    const container = $("#dash-sections");
    if (!container || !Array.isArray(layout)) return;
    const cards = new Map($$("#dash-sections > [data-card]").map(card => [card.dataset.card, card]));
    layout.forEach(item => {
      const card = cards.get(item.key);
      if (!card) return;
      card.style.display = item.hidden ? "none" : "";
      container.append(card);
    });
    updateHiddenShelf();
  }

  function updateHiddenShelf() {
    const hidden = $$("#dash-sections > [data-card]").filter(card => card.style.display === "none");
    const shelf = $("#dash-hidden-shelf");
    const items = $("#hidden-shelf-items");
    if (!shelf || !items) return;
    items.replaceChildren();
    hidden.forEach(card => {
      const button = document.createElement("button");
      button.className = "btn btn-sm btn-secondary";
      button.type = "button";
      button.textContent = `Mostrar ${card.dataset.label || card.dataset.card}`;
      button.addEventListener("click", () => restoreCard(card.dataset.card));
      items.append(button);
    });
    shelf.style.display = hidden.length ? "block" : "none";
  }

  function setCardsEditable(editable) {
    $$("#dash-sections > [data-card]").forEach(card => {
      card.draggable = editable;
      let remove = $(".card-remove-btn", card);
      if (editable && !remove) {
        remove = document.createElement("button");
        remove.className = "card-remove-btn";
        remove.type = "button";
        remove.title = "Ocultar seção";
        remove.setAttribute("aria-label", `Ocultar ${card.dataset.label || "seção"}`);
        remove.textContent = "×";
        remove.addEventListener("click", event => {
          event.stopPropagation();
          removeCard(card.dataset.card);
        });
        card.append(remove);
      } else if (!editable) {
        remove?.remove();
      }
    });
  }

  function enterEditMode() {
    const bar = $("#dash-edit-bar");
    const container = $("#dash-sections");
    if (!bar || !container) return;
    editSnapshot = currentLayout();
    container.classList.add("editing");
    bar.style.display = "block";
    setCardsEditable(true);
    updateHiddenShelf();
    showToast("Arraste as seções para reorganizar ou oculte as que não usa.");
  }

  function exitEditMode(save) {
    const container = $("#dash-sections");
    const bar = $("#dash-edit-bar");
    if (!container || !bar) return;
    if (save) {
      writeState({ layout: currentLayout() });
      showToast("Layout salvo neste navegador.", "success");
    } else if (editSnapshot) {
      applyLayout(editSnapshot);
      showToast("Alterações descartadas.");
    }
    container.classList.remove("editing");
    bar.style.display = "none";
    setCardsEditable(false);
    editSnapshot = null;
  }

  function removeCard(key) {
    const card = $(`#dash-sections > [data-card="${CSS.escape(key)}"]`);
    if (!card) return;
    card.style.display = "none";
    updateHiddenShelf();
  }

  function restoreCard(key) {
    const card = $(`#dash-sections > [data-card="${CSS.escape(key)}"]`);
    if (!card) return;
    card.style.display = "";
    updateHiddenShelf();
  }

  function resetDashLayout() {
    const state = readState();
    delete state.layout;
    writeState(state);
    const container = $("#dash-sections");
    if (container) {
      $$("[data-card]", container).forEach(card => { card.style.display = ""; container.append(card); });
    }
    updateHiddenShelf();
    showToast("Layout de demonstração redefinido.", "success");
  }

  function openMetricColor(event) {
    event?.stopPropagation();
    const pop = $("#metric-color-pop");
    if (!pop) return;
    const opening = pop.style.display === "none";
    pop.style.display = opening ? "block" : "none";
    if (!opening) return;
    const rect = $("#btn-metric-color")?.getBoundingClientRect();
    if (rect) {
      pop.style.position = "fixed";
      pop.style.top = `${Math.min(rect.bottom + 8, window.innerHeight - pop.offsetHeight - 12)}px`;
      pop.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - pop.offsetWidth - 12))}px`;
    }
  }

  function closeMetricColor() {
    const pop = $("#metric-color-pop");
    if (pop) pop.style.display = "none";
  }

  function setMetricColor(key, color) {
    const safe = /^#[\da-f]{6}$/i.test(color) ? color : "#1A6DFF";
    const colors = { ...(readState().metricColors || {}), [key]: safe };
    writeState({ metricColors: colors });
    const css = $("#metric-color-css");
    if (css) css.textContent = Object.entries(colors).map(([name, value]) => `[data-card="${CSS.escape(name)}"] .kpi-value:not(.text-danger),[data-card="${CSS.escape(name)}"] .kpi-change.positive{color:${value}!important;}`).join("\n");
  }

  function resetAllMetricColors() {
    writeState({ metricColors: {} });
    const css = $("#metric-color-css");
    if (css) css.textContent = "";
    $$(".metric-color-row .mc-input").forEach(input => { input.value = "#1a6dff"; });
    closeMetricColor();
    showToast("Cores padrão restauradas.", "success");
  }

  function openModal(name) {
    const overlay = $(`#${name}-modal-overlay`);
    const modal = $(`#${name}-modal`);
    if (overlay) overlay.style.display = "block";
    if (modal) {
      modal.style.display = "block";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.querySelector("input,select,button")?.focus();
    }
  }

  function closeModal(name) {
    const overlay = $(`#${name}-modal-overlay`);
    const modal = $(`#${name}-modal`);
    if (overlay) overlay.style.display = "none";
    if (modal) {
      modal.style.display = "none";
      modal.removeAttribute("aria-modal");
    }
  }

  function saveModal(name, message) {
    const modal = $(`#${name}-modal`);
    const values = modal ? $$("input,select", modal).map(field => field.type === "checkbox" ? field.checked : field.value) : [];
    writeState({ [`${name}Config`]: values });
    closeModal(name);
    showToast(message, "success");
  }

  function ltConfirm(message) {
    return new Promise(resolve => {
      const overlay = $("#lt-confirm-overlay");
      const text = $("#lt-confirm-msg");
      const yes = $("#lt-confirm-ok");
      const no = $("#lt-confirm-cancel");
      if (!overlay || !yes || !no) return resolve(window.confirm(message));
      text.textContent = message;
      overlay.style.display = "flex";
      requestAnimationFrame(() => { overlay.style.opacity = "1"; });
      const finish = result => {
        overlay.style.opacity = "0";
        window.setTimeout(() => { overlay.style.display = "none"; }, 180);
        yes.removeEventListener("click", accept);
        no.removeEventListener("click", cancel);
        resolve(result);
      };
      const accept = () => finish(true);
      const cancel = () => finish(false);
      yes.addEventListener("click", accept, { once: true });
      no.addEventListener("click", cancel, { once: true });
    });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }

  const moduleTables = {
    "/campaigns": {
      title: "Campanhas", description: "Acompanhe a operação com registros locais de demonstração.", columns: ["Campanha", "Canal", "Status", "Investimento", "ROAS"], rows: [["Campanha Demo 01", "Meta Ads", "Ativa", "R$ 320,00", "2,4x"], ["Campanha Demo 02", "TikTok Ads", "Pausada", "R$ 180,00", "1,8x"], ["Campanha Demo 03", "Meta Ads", "Ativa", "R$ 95,00", "—"]], action: ["Nova campanha demo", "create-campaign"]
    },
    "/sales": {
      title: "Vendas", description: "Pedidos de demonstração; nenhum checkout está conectado.", columns: ["Pedido", "Cliente", "Produto", "Valor", "Estado", "Origem"], rows: [["AR-1008", "Cliente demo", "Kit Rotina Leve", "R$ 197,00", "Aprovada", "Meta Ads"], ["AR-1007", "Cliente demo", "Método Essencial", "R$ 97,00", "Pendente", "Sem origem"], ["AR-1006", "Cliente demo", "Aula Intensiva", "R$ 47,00", "Aprovada", "TikTok Ads"]], action: ["Simular venda", "simulate-sale"]
    },
    "/visits": {
      title: "Visitas", description: "Sessões sintéticas para visualizar a navegação do funil.", columns: ["Origem", "Página", "Dispositivo", "Sessões", "Última atividade"], rows: [["Meta Ads", "/oferta", "Mobile", "862", "Hoje, 10:42"], ["TikTok Ads", "/produto", "Mobile", "214", "Hoje, 09:18"], ["Direto", "/checkout", "Desktop", "164", "Ontem, 21:05"]]
    }
  };

  function tableMarkup(columns, rows) {
    return `<div class="module-table-wrap"><table><thead><tr>${columns.map(item => `<th>${escapeHtml(item)}</th>`).join("")}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(item => `<td>${escapeHtml(item)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }

  const plaqueMilestones = [
    { id: "10k", name: "Start", short: "10K", amount: 10000, amountLabel: "R$ 10 mil", color: "#44b8f4", secondary: "#b9e8ff" },
    { id: "100k", name: "Pro", short: "100K", amount: 100000, amountLabel: "R$ 100 mil", color: "#7c9dc7", secondary: "#e3edf8" },
    { id: "500k", name: "Elite", short: "500K", amount: 500000, amountLabel: "R$ 500 mil", color: "#d9a91d", secondary: "#ffdf62" },
    { id: "1m", name: "Legend", short: "1M", amount: 1000000, amountLabel: "R$ 1 milhão", color: "#08a8bd", secondary: "#7de9e6" },
    { id: "5m", name: "Titan", short: "5M", amount: 5000000, amountLabel: "R$ 5 milhões", color: "#b77739", secondary: "#f4c879" },
    { id: "10m", name: "Master", short: "10M", amount: 10000000, amountLabel: "R$ 10 milhões", color: "#18a8c7", secondary: "#74e1ea" },
    { id: "20m", name: "Icon", short: "20M", amount: 20000000, amountLabel: "R$ 20 milhões", color: "#9b67d7", secondary: "#d5b9ff" }
  ];

  const plaqueIconPaths = [
    '<path d="m12 2 2.8 6 6.5.8-4.8 4.6 1.2 6.5-5.7-3.2-5.7 3.2 1.2-6.5-4.8-4.6 6.5-.8z"/>',
    '<circle cx="12" cy="8" r="6"/><path d="m8.5 13-1 8 4.5-2.8 4.5 2.8-1-8"/>',
    '<path d="M8 21h8m-4-4v4M7 4h10v6a5 5 0 0 1-10 0zM7 6H4v2a4 4 0 0 0 4 4m9-6h3v2a4 4 0 0 1-4 4"/>',
    '<path d="m3 8 4 3 5-7 5 7 4-3v12H3zM7 20v-5h10v5"/>',
    '<path d="m12 2 9 7-9 13L3 9zM3 9h18M9 9l3 13 3-13-3-7"/>',
    '<path d="m12 3 2.2 5.2 5.6.5-4.3 3.7 1.3 5.5-4.8-3-4.8 3 1.3-5.5-4.3-3.7 5.6-.5z"/><path d="M12 1v-1M3 4 2 3m19 1 1-1"/>',
    '<path d="M14 4c3.5 2.5 5 6 4 10l-6 6-4-4 6-6c4-1 7 .5 9 4-1 0-3 .2-4 1M8 16l-4 1-2 5 5-2 1-4"/>'
  ];

  function plaqueIconMarkup(index) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${plaqueIconPaths[index] || plaqueIconPaths[0]}</svg>`;
  }

  function plaqueArtMarkup(milestone, index, compact = false) {
    const id = `plaque-${index}-${compact ? "map" : "card"}`;
    return `<svg class="plq-art${compact ? " plq-art-compact" : ""}" viewBox="0 0 180 238" aria-hidden="true" focusable="false" style="--plq-metal:${milestone.color};--plq-light:${milestone.secondary}">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="var(--plq-light)"/><stop offset=".48" stop-color="var(--plq-metal)"/><stop offset="1" stop-color="#101d36"/></linearGradient><linearGradient id="${id}-face" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#172944"/><stop offset="1" stop-color="#091426"/></linearGradient></defs>
      <rect x="7" y="7" width="166" height="224" rx="15" fill="#091426" stroke="url(#${id})" stroke-width="5"/><rect x="15" y="15" width="150" height="208" rx="10" fill="url(#${id}-face)" stroke="var(--plq-metal)" stroke-opacity=".55"/>
      <path d="M26 24h128M26 214h128" stroke="var(--plq-metal)" stroke-opacity=".62"/><circle cx="90" cy="67" r="25" fill="url(#${id})" stroke="var(--plq-light)" stroke-opacity=".72"/>
      <g transform="translate(78 55)" color="#081426" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${plaqueIconPaths[index] || plaqueIconPaths[0]}</g><image href="/brand/nemofy-symbol.svg" x="72" y="108" width="36" height="36"/>
      <text x="90" y="163" text-anchor="middle" fill="#f5f8ff" font-size="${milestone.short.length > 4 ? 19 : 24}" font-weight="800" letter-spacing="1">${milestone.short}</text><text x="90" y="181" text-anchor="middle" fill="var(--plq-light)" font-size="7" font-weight="700" letter-spacing="1.25">FATURAMENTO</text><text x="90" y="204" text-anchor="middle" fill="#aab9d0" font-size="8" font-weight="700" letter-spacing="1">NEMOFY</text>
    </svg>`;
  }

  function plaqueScreenMarkup() {
    const revenue = 0;
    const next = plaqueMilestones[0];
    const percent = Math.max(0, Math.min(100, revenue / next.amount * 100));
    const positions = [[19, 74], [31, 82], [43, 64], [55, 70], [67, 50], [79, 56], [91, 36]];
    const mapStops = plaqueMilestones.map((milestone, index) => {
      const [left, top] = positions[index];
      const status = index === 0 ? "next" : "locked";
      return `<button class="plq-stop ${status}" type="button" data-plaque-jump="plaque-${milestone.id}" style="left:${left}%;top:${top}%;--plq-delay:${index * 90}ms" aria-label="${milestone.name}, meta de ${milestone.amountLabel} em faturamento, ${index === 0 ? "em progresso" : "bloqueada"}"><span class="plq-map-award">${plaqueArtMarkup(milestone, index, true)}</span><i aria-hidden="true"></i><span class="plq-stop-name">${milestone.name}</span><span class="plq-stop-val">${milestone.short}</span></button>`;
    }).join("");
    const cards = plaqueMilestones.map((milestone, index) => {
      const active = index === 0;
      return `<article class="plq-row" id="plaque-${milestone.id}" aria-labelledby="plq-title-${milestone.id}"><div class="plq-card ${active ? "next" : "locked"}">
        <header class="plq-card-hd"><div class="plq-card-title"><p>Placa ${milestone.short}</p><h2 id="plq-title-${milestone.id}">${milestone.amountLabel} em faturamento</h2></div><span class="plq-tier-icon">${plaqueIconMarkup(index)}</span></header>
        <p class="plq-card-desc">${active ? "Seu primeiro marco na jornada. Acompanhe o avanço até alcançar R$ 10 mil em faturamento." : `Marco comemorativo dos primeiros ${milestone.amountLabel} faturados na plataforma.`}${index >= 4 ? " Placa em tamanho especial." : ""}</p>
        <div class="plq-media">${plaqueArtMarkup(milestone, index)}</div>
        <footer class="plq-card-foot"><span class="plq-badge ${active ? "in-progress" : "locked-badge"}">${active ? "Em progresso" : "Bloqueada"}</span><span class="plq-card-target">Meta: ${milestone.amountLabel}</span></footer>
      </div></article>`;
    }).join("");
    const formatCurrency = value => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);

    return `<section class="module-screen plq-screen" aria-labelledby="plq-heading"><div class="plq-journey">
      <header class="plq-j-head"><div><p class="plq-j-level">Jornada de conquistas · nível 0 de 7</p><h1 class="page-title" id="plq-heading">Sua jornada de placas</h1><p>Acompanhe os marcos de faturamento da sua operação.</p></div>
        <div class="plq-j-stat"><span class="plq-stat-label">Faturamento</span><strong>${formatCurrency(revenue)}</strong><span>Faltam ${formatCurrency(next.amount - revenue)} para Start</span><div class="plq-j-bar" role="progressbar" aria-label="Progresso até a placa Start" aria-valuemin="0" aria-valuemax="${next.amount}" aria-valuenow="${revenue}"><span style="width:${percent}%"></span></div></div>
      </header>
      <div class="plq-map" role="region" aria-label="Mapa da jornada de faturamento"><svg class="plq-mtn" viewBox="0 0 1000 500" preserveAspectRatio="none" aria-hidden="true">
        <defs><linearGradient id="plq-sky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#f4f8ff"/><stop offset="1" stop-color="#e8f0ff"/></linearGradient><linearGradient id="plq-trail" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#246dff"/><stop offset="1" stop-color="#8f6ce8"/></linearGradient></defs>
        <path class="plq-sky-fill" d="M0 0h1000v500H0z"/><path class="mtn-back" d="M0 270 110 205 225 254 382 150 520 220 644 118 778 190 900 78 1000 132V500H0Z"/><path class="mtn-mid" d="M0 342 140 290 300 330 450 260 600 300 760 220 880 260 1000 210V500H0Z"/><path class="mtn-front" d="M0 420 180 380 330 410 520 360 700 400 860 350 1000 380V500H0Z"/><path class="plq-trail-base" d="M68 440 190 370 310 410 430 320 550 350 670 250 790 280 910 180"/><path class="plq-trail-progress" pathLength="1" d="M68 440 190 370 310 410 430 320 550 350 670 250 790 280 910 180"/>
      </svg><div class="plq-start-marker" aria-label="Você está no início da jornada"><img src="/brand/nemofy-symbol.svg" alt="" width="27" height="27"><span>Início</span></div>${mapStops}</div>
      <p class="plq-demo-note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/></svg>Dados demonstrativos. O faturamento e os marcos ainda não estão conectados a contas reais.</p>
    </div><section class="plq-catalog" aria-labelledby="plq-catalog-title"><div class="plq-catalog-heading"><div><h2 id="plq-catalog-title">Marcos de faturamento</h2><p>Explore as sete conquistas da jornada.</p></div><div class="plq-nav-group"><button class="plq-nav prev" type="button" data-plaque-scroll="-1" aria-label="Placas anteriores" disabled><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></button><button class="plq-nav next" type="button" data-plaque-scroll="1" aria-label="Próximas placas"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></button></div></div><div class="plq-track" tabindex="0" aria-label="Carrossel de marcos de faturamento">${cards}</div></section><p class="plq-footer-note">As placas físicas e solicitações de envio não estão disponíveis nesta demonstração.</p></section>`;
  }

  function plansScreenMarkup() {
    const plans = [
      {
        name: "Basic", price: "47", tagline: "Para come\u00e7ar com o p\u00e9 direito",
        features: ["Vendas ilimitadas", "2 contas de an\u00fancios", "2 pixels de rastreio", "1 dashboard", "1 webhook", "Envio autom\u00e1tico CAPI", "Notifica\u00e7\u00f5es de vendas", "Alerta de saldo baixo", "Alerta de cobran\u00e7a Meta", "2 regras de automa\u00e7\u00e3o", "Suporte via WhatsApp", { label: "Duplicar conjunto autom\u00e1tico", unavailable: true }]
      },
      {
        name: "Pro", price: "97", tagline: "A escolha de quem est\u00e1 escalando",
        features: [{ label: "Tudo do Basic +", strong: true }, "5 contas de an\u00fancios", "5 pixels de rastreio", "5 dashboards", "5 webhooks", "7 regras de automa\u00e7\u00e3o", "Notifica\u00e7\u00f5es de vendas", "Alerta de saldo baixo", "Alerta de cobran\u00e7a Meta", "Suporte via WhatsApp", { label: "Duplicar conjunto autom\u00e1tico", unavailable: true }]
      },
      {
        name: "Scale", price: "247", tagline: "Para opera\u00e7\u00f5es sem limites",
        features: [{ label: "Tudo do Pro +", strong: true }, "Contas ilimitadas", "Pixels ilimitados", "Dashboards ilimitados", "Webhooks ilimitados", "15 regras de automa\u00e7\u00e3o", "Duplicar conjunto autom\u00e1tico", "Notifica\u00e7\u00f5es de vendas", "Alerta de saldo baixo", "Alerta de cobran\u00e7a Meta", "Suporte via WhatsApp"]
      }
    ];
    const cards = plans.map(plan => `<article class="plan-pro">
      <div class="plan-pro-head"><h3>${plan.name}</h3></div>
      <div class="plan-pro-price"><span class="v">R$ ${plan.price}</span><span class="p">/m\u00eas</span></div>
      <p class="plan-pro-trial">${plan.tagline}</p>
      <ul class="plan-pro-list">${plan.features.map(feature => {
        const item = typeof feature === "string" ? { label: feature } : feature;
        return `<li${item.unavailable ? ' class="no"' : ""}>${item.strong ? `<strong>${item.label}</strong>` : item.label}</li>`;
      }).join("")}</ul>
      <button class="plan-cta" type="button" data-demo-action="select-plan"><span>Assinar ${plan.name}</span></button>
    </article>`).join("");

    return `<section class="module-screen plans-screen" aria-labelledby="plans-heading">
      <header class="page-top plans-page-top"><div><h1 class="page-title" id="plans-heading">Planos</h1><p class="page-subtitle">Comece pequeno. Escale quando precisar.</p></div></header>
      <div class="plan-alert plan-alert--info animate-in">Voc\u00ea est\u00e1 no <strong>Teste Gratuito</strong> \u2014 restam <strong>6 dias</strong>. Escolha um plano abaixo.</div>
      <div class="plans-pro animate-in">${cards}</div>
      <p class="plans-note animate-in">Sele\u00e7\u00e3o demonstrativa \u00b7 Nenhuma contrata\u00e7\u00e3o ou cobran\u00e7a ser\u00e1 iniciada.</p>
    </section>`;
  }
  function moduleMarkup(pathname) {
    const main = $("#main-content");
    const suppliedScreen = window.AnalisaScreens?.render(pathname);
    if (suppliedScreen) return suppliedScreen;
    if (pathname === "/placas") return plaqueScreenMarkup();
    if (pathname === "/plans") return plansScreenMarkup();
    const table = moduleTables[pathname];
    if (table) {
      const action = table.action ? `<button class="btn btn-sm btn-primary" type="button" data-demo-action="${table.action[1]}">${table.action[0]}</button>` : "";
      return `<section class="module-screen"><header class="module-heading"><h1 class="page-title">${table.title}</h1><p>${table.description}</p></header><div class="alert alert-info"><strong>Ambiente de demonstração</strong> · Dados locais e ilustrativos.</div><div class="module-toolbar"><input type="search" data-module-search placeholder="Buscar ${table.title.toLowerCase()}…" aria-label="Buscar ${table.title.toLowerCase()}">${action}<button class="btn btn-sm btn-secondary" type="button" data-demo-action="export-module">Exportar CSV</button></div>${tableMarkup(table.columns, table.rows)}</section>`;
    }
    const titleMap = {
      "/rules": ["Regras", "Automação em modo local. Nenhuma campanha será alterada."],
      "/integrations": ["Integrações", "Conectores externos aguardam configuração e credenciais."],
      "/notifications": ["Notificações", "Preferências salvas somente neste navegador."],
      "/plans": ["Planos", "Valores de referência. Nenhuma contratação ou cobrança ativa."],
      "/support": ["Suporte", "Central de ajuda da demonstração local."],
      "/account": ["Conta local", "Perfil demonstrativo sem dados pessoais conectados."],
      "/settings": ["Configurações", "Preferências locais do painel Nemofy."],
      "/placas": ["Premiações", "Marcos ilustrativos exibidos para esta demonstração."]
    };
    const [title, description] = titleMap[pathname] || ["Painel", "Área local do Nemofy."];
    const head = `<header class="module-heading"><h1 class="page-title">${title}</h1><p>${description}</p></header><div class="alert alert-info"><strong>Ambiente de demonstração</strong> · Os dados são locais; integrações externas e cobranças estão desativadas.</div>`;
    if (pathname === "/integrations") {
      const names = ["Meta Ads", "TikTok Ads", "Hotmart", "Kiwify", "Webhooks"];
      return `<section class="module-screen">${head}<div class="module-list">${names.map(name => `<div class="module-row"><div><strong>${name}</strong><p>Pronto para conexão em uma etapa futura</p></div><span class="module-status">Não conectado</span></div>`).join("")}</div><p class="module-empty">Nenhuma conta externa está conectada nesta versão.</p></section>`;
    }
    if (pathname === "/rules") {
      return `<section class="module-screen">${head}<div class="module-list">${[["Pausar campanha com CPA alto", "Desativada"], ["Avisar sobre saldo baixo", "Desativada"]].map(([name, state], index) => `<div class="module-row"><div><strong>${name}</strong><p>Regra ilustrativa ${index + 1} · sem ações externas</p></div><label class="module-status"><input class="module-switch" type="checkbox" data-local-toggle="rule-${index}" aria-label="Ativar ${name}"> <span>${state}</span></label></div>`).join("")}</div></section>`;
    }
    if (pathname === "/notifications") {
      return `<section class="module-screen">${head}<div class="module-list">${["Vendas aprovadas", "Vendas pendentes", "Relatório das 08:00", "Relatório das 18:00"].map((name, index) => `<div class="module-row"><strong>${name}</strong><label><input class="module-switch" type="checkbox" data-local-toggle="notification-${index}" aria-label="Receber ${name}"></label></div>`).join("")}</div><button class="btn btn-sm btn-secondary" type="button" data-demo-action="test-notification">Testar aviso local</button></section>`;
    }
    if (pathname === "/plans") {
      return `<section class="module-screen">${head}<div class="module-grid">${[["Basic", "R$ 47/mês"], ["Pro", "R$ 97/mês"], ["Scale", "R$ 247/mês"]].map(([name, value]) => `<article class="module-stat"><small>${name}</small><strong>${value}</strong><p><button class="btn btn-sm btn-secondary" type="button" data-demo-action="select-plan">Ver plano</button></p></article>`).join("")}</div></section>`;
    }
    if (pathname === "/placas") {
      return `<section class="module-screen">${head}<div class="module-grid">${["R$ 10 mil", "R$ 100 mil", "R$ 500 mil"].map((value, index) => `<article class="module-stat"><small>Marco ${index + 1}</small><strong>${value}</strong><p>Meta demonstrativa de faturamento</p></article>`).join("")}</div></section>`;
    }
    if (pathname === "/settings") {
      return `<section class="module-screen">${head}<div class="module-list"><div class="module-row"><div><strong>Tema do painel</strong><p>A preferência fica salva neste navegador.</p></div><button class="btn btn-sm btn-secondary" type="button" data-demo-action="toggle-theme">Alternar tema</button></div><div class="module-row"><div><strong>Dados locais</strong><p>Redefina o layout e as preferências demonstrativas.</p></div><button class="btn btn-sm btn-secondary" type="button" data-demo-action="reset-data">Restaurar dados</button></div></div></section>`;
    }
    if (pathname === "/support") {
      return `<section class="module-screen">${head}<div class="module-empty"><strong>Ajuda da demonstração</strong><p>As conexões com atendimento externo ainda não estão disponíveis.</p><button class="btn btn-sm btn-primary" type="button" data-demo-action="demo-support">Ver informações locais</button></div></section>`;
    }
    if (pathname === "/account") {
      return `<section class="module-screen">${head}<div class="module-form"><label class="module-field">Nome da conta<input value="Conta local" readonly></label><label class="module-field">Workspace<input value="Nemofy · demonstração" readonly></label><p class="module-full-width">Esta tela não contém credenciais nem dados pessoais.</p></div></section>`;
    }
    return `<section class="module-screen">${head}<div class="module-empty">Esta rota está pronta para receber o módulo local correspondente.</div></section>`;
  }

  function renderRoute() {
    setRouteActive();
    const path = window.location.pathname.replace(/\/$/, "") || "/";
    if (path === "/logout") {
      location.replace("/");
      return;
    }
    if (path !== "/dashboard") {
      const main = $("#main-content");
      if (main) main.innerHTML = moduleMarkup(path);
      document.title = `${$(".page-title", main)?.textContent || "Painel"} | Nemofy`;
    }
  }

  function initDatePicker() {
    const slot = $(".lt-range-cal");
    if (!slot) return;
    const state = readState();
    const from = state.dateFrom || $("#date_from")?.value || "";
    const to = state.dateTo || $("#date_to")?.value || "";
    slot.innerHTML = `<div class="lt-local-date-fields"><label for="local-date-from">De<input id="local-date-from" type="date" value="${escapeHtml(from)}"></label><label for="local-date-to">Até<input id="local-date-to" type="date" value="${escapeHtml(to)}"></label></div>`;
  }

  async function initMaps() {
    const wrappers = $$(".geo-map-svgwrap[data-map-src]");
    await Promise.all(wrappers.map(async wrapper => {
      const source = wrapper.dataset.mapSrc;
      if (!source) return;
      try {
        const response = await fetch(source, { credentials: "same-origin" });
        if (!response.ok) throw new Error("map missing");
        wrapper.innerHTML = await response.text();
      } catch {
        wrapper.innerHTML = `<svg viewBox="0 0 600 260" role="img" aria-label="Mapa demonstrativo"><rect width="600" height="260" rx="10" fill="var(--color-primary-light)"/><path d="M42 121l42-35 52 6 22 32-15 26-44 9-38-12zm155-51 52-26 68 11 19 29-33 17-59-4-36 17-25-15zm116 84 37-24 61 12 44 32-32 26-67-6-43-18zm111-89 43-17 37 18-6 33-48 8-29-19z" fill="var(--color-primary)" opacity=".18"/><circle cx="295" cy="130" r="8" fill="var(--color-primary)"/><circle cx="295" cy="130" r="17" fill="none" stroke="var(--color-primary)" opacity=".4"/></svg>`;
      }
    }));
    initGeoInteractions();
  }

  function initGeoInteractions() {
    const grid = $(".geo-grid");
    const tooltip = $("#geoTooltip");
    if (!grid || !tooltip) return;
    const worldSvg = $(".geo-map-world svg", grid);
    const brazilSvg = $(".geo-map-br svg", grid);
    worldSvg?.classList.add("world-map-svg");
    brazilSvg?.classList.add("br-map-svg");
    const show = (path, event, index, country) => {
      const rect = grid.getBoundingClientRect();
      const name = path.getAttribute("name") || path.getAttribute("data-name") || path.getAttribute("data-uf") || path.id || (country ? "Região do Brasil " + (index + 1) : "Região mundial " + (index + 1));
      $("#gtName", tooltip).textContent = name;
      $("#gtQty", tooltip).textContent = "0 vendas";
      $("#gtRev", tooltip).textContent = "R$ 0,00";
      tooltip.classList.add("visible");
      const point = event instanceof MouseEvent ? { x: event.clientX - rect.left + 14, y: event.clientY - rect.top + 14 } : { x: Math.max(8, path.getBoundingClientRect().left - rect.left), y: Math.max(8, path.getBoundingClientRect().top - rect.top) };
      const left = point.x + 190 > rect.width ? point.x - 198 : point.x;
      tooltip.style.left = Math.max(4, left) + "px";
      tooltip.style.top = Math.max(4, Math.min(point.y, rect.height - tooltip.offsetHeight - 4)) + "px";
    };
    const bind = (svg, country) => svg?.querySelectorAll("path").forEach((path, index) => {
      if (path.closest("defs,clipPath,mask") || path.getAttribute("fill") === "none") return;
      path.setAttribute("tabindex", "0");
      path.setAttribute("role", "button");
      path.setAttribute("aria-label", (path.getAttribute("name") || path.getAttribute("data-name") || path.getAttribute("data-uf") || (country ? "Região do Brasil " : "Região mundial ") + (index + 1)) + ", 0 vendas");
      path.addEventListener("mousemove", event => show(path, event, index, country));
      path.addEventListener("mouseenter", event => show(path, event, index, country));
      path.addEventListener("mouseleave", () => tooltip.classList.remove("visible"));
      path.addEventListener("focus", event => show(path, event, index, country));
      path.addEventListener("blur", () => tooltip.classList.remove("visible"));
    });
    bind(worldSvg, false);
    bind(brazilSvg, true);
  }

  function initMetricColors() {
    const colors = readState().metricColors || {};
    const css = $("#metric-color-css");
    if (css) css.textContent = Object.entries(colors).map(([name, value]) => `[data-card="${CSS.escape(name)}"] .kpi-value:not(.text-danger),[data-card="${CSS.escape(name)}"] .kpi-change.positive{color:${value}!important;}`).join("\n");
    $$(".metric-color-row").forEach(row => {
      const input = $(".mc-input", row);
      const key = row.dataset.key;
      if (!input || !key) return;
      if (colors[key]) input.value = colors[key];
      input.addEventListener("input", () => setMetricColor(key, input.value));
      $(".mc-reset", row)?.addEventListener("click", () => {
        input.value = "#1a6dff";
        const next = { ...(readState().metricColors || {}) };
        delete next[key];
        writeState({ metricColors: next });
        initMetricColors();
      });
    });
  }

  function initLayout() {
    const state = readState();
    if (Array.isArray(state.layout)) applyLayout(state.layout);
    const container = $("#dash-sections");
    if (!container) return;
    let dragging = null;
    container.addEventListener("dragstart", event => {
      const card = event.target.closest("[data-card]");
      if (!card || !container.classList.contains("editing")) return;
      dragging = card;
      card.classList.add("dragging-card");
      event.dataTransfer?.setData("text/plain", card.dataset.card);
      if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
    });
    container.addEventListener("dragover", event => {
      const target = event.target.closest("[data-card]");
      if (!dragging || !target || target === dragging) return;
      event.preventDefault();
      const box = target.getBoundingClientRect();
      container.insertBefore(dragging, event.clientY < box.top + box.height / 2 ? target : target.nextSibling);
    });
    container.addEventListener("dragend", () => {
      dragging?.classList.remove("dragging-card");
      dragging = null;
    });
  }

  function initModuleInteractions() {
    const search = $("[data-module-search]");
    search?.addEventListener("input", () => {
      const query = search.value.trim().toLocaleLowerCase("pt-BR");
      $$(".module-table-wrap tbody tr").forEach(row => { row.hidden = !row.textContent.toLocaleLowerCase("pt-BR").includes(query); });
    });
    $$("[data-local-toggle]").forEach(toggle => {
      const state = readState().toggles || {};
      toggle.checked = Boolean(state[toggle.dataset.localToggle]);
      toggle.addEventListener("change", () => {
        const next = { ...(readState().toggles || {}), [toggle.dataset.localToggle]: toggle.checked };
        writeState({ toggles: next });
        showToast("Preferência salva localmente.", "success");
      });
    });
  }

  function initPlaqueInteractions() {
    const syncNavigation = (screen = document) => {
      const roots = screen.matches?.(".plq-screen") ? [screen] : $$(".plq-screen", screen);
      roots.forEach(root => {
        const track = $(".plq-track", root);
        const previous = $("[data-plaque-scroll='-1']", root);
        const next = $("[data-plaque-scroll='1']", root);
        if (!track || !previous || !next) return;
        const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
        previous.disabled = track.scrollLeft <= 2;
        next.disabled = maxScroll - track.scrollLeft <= 2;
      });
    };

    syncNavigation();
    window.addEventListener("resize", () => syncNavigation());
    document.addEventListener("scroll", event => {
      if (event.target instanceof HTMLElement && event.target.matches(".plq-track")) syncNavigation(event.target.closest(".plq-screen"));
    }, true);
    document.addEventListener("lt:content-loaded", () => requestAnimationFrame(() => syncNavigation()));
    document.addEventListener("click", event => {
      const jump = event.target.closest("[data-plaque-jump]");
      if (jump) {
        const screen = jump.closest(".plq-screen");
        const card = screen && $("#" + CSS.escape(jump.dataset.plaqueJump), screen);
        if (!card) return;
        card.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest", inline: "start" });
        card.classList.remove("plq-flash");
        void card.offsetWidth;
        card.classList.add("plq-flash");
        return;
      }

      const control = event.target.closest("[data-plaque-scroll]");
      if (control) {
        const screen = control.closest(".plq-screen");
        const track = screen && $(".plq-track", screen);
        const firstCard = track && $(".plq-row", track);
        if (!track || !firstCard) return;
        const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 14;
        const step = firstCard.getBoundingClientRect().width + gap;
        track.scrollBy({ left: Number(control.dataset.plaqueScroll) * step, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
        requestAnimationFrame(() => syncNavigation(screen));
      }
    });
  }

  function onLocalAction(action) {
    if (action === "create-campaign" || action === "simulate-sale") {
      const body = $(".module-table-wrap tbody");
      if (body) {
        const values = action === "create-campaign"
          ? ["Campanha Demo 04", "Meta Ads", "Rascunho", "R$ 0,00", "—"]
          : [`AR-${1009 + body.rows.length}`, "Cliente demo", "Produto demonstrativo", "R$ 47,00", "Pendente", "Sem origem"];
        const row = document.createElement("tr");
        values.forEach(value => { const cell = document.createElement("td"); cell.textContent = value; row.append(cell); });
        body.prepend(row);
      }
      showToast(action === "create-campaign" ? "Campanha de demonstração criada localmente." : "Venda de demonstração adicionada localmente.", "success");
    }
    else if (action === "select-plan") showToast("A seleção é ilustrativa. Nenhuma contratação foi iniciada.");
    else if (action === "test-notification") showToast("Aviso de teste local: demonstração Nemofy.", "success");
    else if (action === "toggle-theme") toggleTheme();
    else if (action === "reset-data") { try { localStorage.removeItem(DEMO_KEY); } catch {} showToast("Preferências locais removidas.", "success"); }
    else if (action === "demo-support") showToast("Esta versão não envia mensagens para atendimento externo.");
    else if (action === "export-module") {
      const rows = $$(".module-table-wrap tr").map(row => $$("th,td", row).map(cell => cell.textContent.trim()));
      if (!rows.length) return showToast("Não há registros para exportar.", "error");
      const csv = "\uFEFF" + rows.map(row => row.map(value => `"${value.replaceAll('"', '""')}"`).join(";")).join("\r\n");
      const href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = href;
      link.download = "analisa-roi-registros-demonstrativos.csv";
      link.click();
      URL.revokeObjectURL(href);
      showToast("Arquivo CSV exportado do navegador.", "success");
    }
  }

  function init() {
    scheduleAccessRecheck();
    const state = readState();
    document.body.dataset.theme = state.theme === "dark" ? "dark" : "light";
    if (state.sidebarCollapsed) {
      $("#sidebar")?.classList.add("collapsed");
      $(".layout")?.classList.add("sidebar-collapsed");
    }
    updateThemeUI();
    renderRoute();
    window.AnalisaScreens?.applyDashboardPreferences?.();
    initDatePicker();
    initMaps();
    initMetricColors();
    initLayout();
    initModuleInteractions();
    initPlaqueInteractions();

    if (state.privacy) {
      $$(".js-product-name, .js-camp-name, .js-ad-account-id, [data-privacy]").forEach(element => {
        element.dataset.originalText ||= element.textContent;
        element.textContent = "••••••••";
      });
    }
    const period = new URLSearchParams(location.search).get("period") || state.period;
    if (period) changePeriod(period, true);

    document.addEventListener("click", event => {
      const exportLink = event.target.closest("[data-export]");
      if (exportLink) {
        event.preventDefault();
        downloadLocalExport(exportLink.dataset.export);
        return;
      }
      const action = event.target.closest("[data-demo-action]");
      if (action) onLocalAction(action.dataset.demoAction);
      const link = event.target.closest("a[href]");
      if (link?.getAttribute("href") === "/logout") {
        event.preventDefault();
        ltConfirm("Sair da sua conta?").then(ok => { if (ok) location.assign("/logout"); });
        return;
      }
      const picker = $("#date-picker-pop");
      const colors = $("#metric-color-pop");
      if (picker && picker.style.display !== "none" && !picker.contains(event.target) && event.target !== $("#btn-date-picker")) closeDatePicker();
      if (colors && colors.style.display !== "none" && !colors.contains(event.target) && !event.target.closest("#btn-metric-color")) closeMetricColor();
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        closeDatePicker();
        closeMetricColor();
        if ($("#sidebar")?.classList.contains("open")) toggleMenu();
        ["fees", "tax", "meta-tax"].forEach(closeModal);
      }
    });
  }

  Object.assign(window, {
    toggleMenu,
    toggleTheme,
    updateThemeUI,
    toggleSidebarCollapse,
    toggleDashDropdown,
    toggleDashPages,
    changePeriod,
    toggleDatePicker,
    closeDatePicker,
    applyDateFilter,
    refreshDashboardWithSync,
    dashToggleExport,
    togglePrivacyMode,
    enterEditMode,
    exitEditMode,
    removeCard,
    restoreCard,
    resetDashLayout,
    openMetricColor,
    closeMetricColor,
    resetAllMetricColors,
    openFeesModal: () => openModal("fees"),
    closeFeesModal: () => closeModal("fees"),
    saveFeesConfig: () => saveModal("fees", "Taxas salvas neste navegador."),
    openTaxModal: () => openModal("tax"),
    closeTaxModal: () => closeModal("tax"),
    saveTaxConfig: () => saveModal("tax", "Imposto salvo neste navegador."),
    openMetaTaxModal: () => openModal("meta-tax"),
    closeMetaTaxModal: () => closeModal("meta-tax"),
    saveMetaTaxConfig: () => saveModal("meta-tax", "Imposto Meta salvo neste navegador."),
    ltConfirm,
    createDash: () => showToast("Dashboards adicionais poderão ser configurados nesta demonstração."),
    renameDash: () => showToast("Renomeação demonstrativa disponível na próxima etapa."),
    deleteDash: () => showToast("Este dashboard local não pode ser excluído nesta versão.")
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
