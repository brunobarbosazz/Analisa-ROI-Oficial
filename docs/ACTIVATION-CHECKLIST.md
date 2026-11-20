# Checklist para ativação futura

1. Definir escopo de produto, política de dados, retenção, consentimento, preços, fair use, suporte, cancelamento e premiações.
2. Validar marca/domínio e revisar textos comerciais e jurídicos.
3. Confirmar no histórico do projeto as três migrations espelhadas em `supabase/migrations/`; após vincular a CLI, validar o estado antes de qualquer `db push` e adicionar testes RLS automatizados.
4. Configurar Site URL, allowlist, templates de confirmação/recuperação e SMTP; testar o ciclo Auth com e-mail real de teste.
5. Criar contratos de domínio e repositórios com testes; migrar campanhas, vendas, pixels e integrações do localStorage para tabelas isoladas por usuário/workspace.
6. Implementar webhooks de pagamento server-side com assinatura, idempotência, replays, limites, logs sem PII desnecessária e proteção CSRF/SSRF.
7. Criar apps OAuth com permissões mínimas; iniciar em modo leitura e validar tokens, limites e expiração em contas de teste.
8. Validar gateways em sandbox: eventos, assinatura, deduplicação, reembolso, chargeback e ordem de eventos.
9. Revisar segurança, acessibilidade, privacidade, performance e backup; executar testes RLS por usuário e restore.
10. Fazer redeploy do projeto Vercel `analisa-roi-oficial` para carregar as variáveis novas; configurar Site URL/redirects e SMTP do Supabase, decidir domínio público versus proteção SSO, verificar alertas e rollback. Desligar o demo apenas após validação operacional.
