# Relatório de validação

| Cenário | Resultado | Comando / fonte | Observação |
|---|---|---|---|
| Sintaxe JavaScript | passou | `npm run typecheck` | Validou entradas do site, servidor, funções, Auth e painel. |
| Build Vercel | passou | `npm run build` | Gera `dist/`; confirma que `dashboard.html` não é publicado como arquivo estático. |
| Smoke e regras de Trial | passou | `npm test` | Confirma rotas protegidas e que Trial vencido é negado pelo guard do servidor. |
| Migrações Supabase | aplicadas | Supabase Primary · `Nemofy` | Três migrações: fundação Auth/Trial, RLS + índices de FK, e tabela de claims backend-only. |
| Políticas RLS e estrutura | passou | Supabase SQL + Advisors | RLS ligado nas tabelas; políticas de usuário próprio e políticas exclusivas do backend verificadas. Security Advisor sem findings. |
| Performance Advisor | informativo | Supabase Advisors | Os índices de FK ainda não foram usados porque as tabelas estão vazias. Foram mantidos para as consultas com dados. |
| Variáveis Vercel | configuradas | Vercel `analisa-roi-oficial` | `DEMO_MODE=false`, URL Supabase e publishable key criptografada nos três ambientes; `APP_ORIGIN` configurada em Production; valores não foram exibidos. |
| Auth real por e-mail | pendente | — | Templates, SMTP, Site URL e allowlist precisam ser configurados; nenhuma conta de teste foi criada. |
| Deploy Vercel | pronto | Vercel `analisa-roi-oficial` | Deployment de produção READY; criado antes das variáveis de ambiente, então precisa de redeploy para ativar Auth no servidor. |
| Playwright, axe e fluxo E2E | não executado | — | Este workspace não tem runner de navegador nem ciclo de Auth configurado. |
| Checkout e webhooks assinados | não implementado | — | Não há provedor escolhido; o app não simula nem ativa cobranças. |
