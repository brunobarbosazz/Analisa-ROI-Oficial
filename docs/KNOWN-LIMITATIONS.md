# Limitações conhecidas

- O demo local continua sendo uma SPA/servidor Node com dados do dashboard salvos no navegador. Não inserir informação pessoal real no modo demo.
- A base de Supabase Auth, Trial, planos, assinaturas e histórico de pagamentos foi aplicada no projeto `Nemofy`, com guard server-side e RLS. Isso não migra automaticamente os dados operacionais atualmente salvos no localStorage.
- O Trial usa um timestamp de banco de dados e o dashboard é bloqueado no servidor quando expira. O guard de produção só fica ativo com `DEMO_MODE=false` e Supabase configurado; falhas de validação bloqueiam o painel.
- Trial único é garantido por usuário Auth/e-mail verificado e rate limits do Supabase. Novos e-mails ainda podem criar contas distintas; não há fingerprinting de dispositivo.
- Métricas, séries, campanhas, cidades, sessões, produtos, vendas e faturamento são dados didáticos. Fórmulas simplificadas para demonstração, sem conciliação financeira real ou cotações históricas.
- Meta/TikTok, Hotmart/Kiwify/Stripe, OAuth, pixels de produção, UTMs dinâmicas, webhook de pagamento, CAPI, push, faturamento recorrente, prêmio físico e exportação PDF não estão conectados.
- A autenticação por e-mail e redefinição de senha precisam que templates/SMTP e URLs de redirecionamento sejam configurados no Supabase.
- A contratação fica desativada até um gateway ser configurado. Os valores anuais não foram definidos; seleção de plano no frontend não ativa assinatura.
- As páginas auxiliares continuam demonstrativas, sem CRUD persistido de campanhas, vendas, pixels e integrações. Admin permanece sem painel/role de produção.
- Consentimento/cookies só controla a caixa demonstrativa local; não equivale a plataforma de consentimento ou conformidade LGPD/GDPR.
- Preços de referência, textos legais e critérios de prêmio exigem revisão comercial/jurídica. Marca e domínio não foram verificados.
- O projeto Vercel `analisa-roi-oficial` tem deployment de produção READY e as variáveis de backend estão configuradas; é necessário redeploy para carregá-las na execução. O domínio padrão está protegido por SSO. Não foram executados auditoria E2E, acessibilidade automatizada, teste de isolamento remoto, pentest ou validação em dispositivos reais.
