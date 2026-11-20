# Sales page V4 — auditoria e escopo

## Auditoria da base

- Stack: SPA em HTML/CSS/JavaScript, servida por Node HTTP. Sem Next.js, React, router externo ou biblioteca de animação.
- Landing pública única em `/` (rota hash vazia agora resolve à raiz); módulos de demonstração em rotas hash `/app/...`.
- A entrada/cadastro são rotas demo locais. Não existe provider de autenticação, sessão segura, backend de onboarding, checkout, billing nem proteção server-side.
- Basic/Pro/Scale tinham preços de referência no código da tela de planos. O catálogo foi consolidado em `plan-catalog.js`, consumido pela tela de planos e pela oferta pública.
- Redes/gateways permanecem não conectados; dados do painel e showcase são explicitamente demonstrativos.

## Página e conversão

Sales page preserva o layout e a landing já desenvolvidos. Inclui narrativa de problema/solução, visão de módulos, fluxo de configuração, limitações de atribuição, estados de integração, conteúdo de segurança alinhado à implementação, comparação de planos de referência, transparência em vez de depoimentos e 13 perguntas frequentes.

Na demonstração local, os CTAs continuam no painel demo. Em SaaS configurado, a landing leva para `/signup` e `/login`; o servidor valida Trial/assinatura antes de entregar o painel. Seleção de plano segue sem iniciar cobrança.

Eventos de landing têm adaptador local desacoplado e somente guardam eventos permitidos no navegador depois do consentimento. Não enviam dados para terceiros.

## Pendências para lançamento

- Implementar cadastro/Auth real, onboarding, sessão server-side, validação de `returnTo`, proteção de rotas e logout.
- Definir política comercial real de preços/limites, termos, privacidade, suporte e checkout.
- Configurar domínio antes de canonical, sitemap, cartões sociais com URL de imagem e metadados permanentes.
- Validar texto jurídico, segurança, disponibilidade das integrações e conteúdo de suporte.
- Playwright, verificações WCAG automatizadas e screenshots nos breakpoints pedidos não estão disponíveis/configurados nesta SPA; não foram declarados como aprovados.
