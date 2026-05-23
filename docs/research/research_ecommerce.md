# Pesquisa: Nicho E-commerce

## Principais Softwares
1. **Nuvemshop** - Plataforma de loja virtual com gestão integrada.
2. **Tray** - Plataforma de e-commerce completa com ERP opcional.
3. **VTEX** - Plataforma enterprise para marketplaces e comércio unificado.
4. **Loja Integrada** - Solução para vender em marketplaces e loja própria.
5. **Shopify** (Brasil) - Plataforma internacional com adaptacoes locais.
6. **Magento (Adobe Commerce)** - Plataforma aberta para grandes lojas.
7. **Woocommerce** (com plugins brasileiros) - Plugin WordPress para e-commerce.

## O que cada software faz
- Nuvemshop: Criação de loja, gestão de pedidos, estoque, pagamentos, marketing básico.
- Tray: Loja virtual, integração com marketplaces, ERP, logística, omnichannel.
- VTEX: Commerce completo, OMS, marketplace, logística, IA para personalização.
- Loja Integrada: Gestão de anúncios em marketplaces, controle de estoque unificado, emissão de NF-e.
- Shopify: Loja, pagamentos, apps, temas, suporte multilíngue (com apps para BR).
- Magento: Personalização profunda, catálogo grande, B2B/B2C, extensões.
- Woocommerce: Loja dentro do WordPress, plugins de pagamento, frete, impostos BR.

## O que cada software não faz (limitações comuns)
- Nuvemshop: Menos robusto para catálogos extremamente grandes ou fluxos B2B complexos.
- Tray: Pode ter custos adicionais por módulos avançados (ERP, logística).
- VTEX: Custo elevado, foco em médios e grandes retailers.
- Loja Integrada: Dependente de marketplaces; loja própria menos destaque.
- Shopify: Taxas de transação adicionais se não usar Shopify Payments; menos flexível no código.
- Magento: Requer expertise técnica, hospedagem e manutenção mais complexas.
- Woocommerce: Performance pode degradar com muitos plugins; escalabilidade limitada sem otimização.

## O que todos fazem (features comuns)
- Criação de vitrine online (produtos, categorias, busca).
- Gestão de estoque (controle de SKUs, reservas).
- Processamento de pagamentos (cartão, boleto, PIX, carteiras).
- Cálculo de frete e integração com correios/transportadoras.
- Emissão de notas fiscais (NF-e) ou NFC-e (dependendo do plano/integração).
- Relatórios de vendas, tickets médios, taxa de conversão.
- Integração com redes sociais para venda (Facebook, Instagram).
- Suporte a cupons, descontos e programas de fidelidade básicos.

## Dores e Problemas Comuns

### Dores Operacionais
- **Estoque sincronizado entre canais:** Vender no Mercado Livre + Shopee + loja própria com estoque unificado é o calcanhar de Aquiles. Overselling constante.
- **Gestão de frete complexa:** Cálculo de frete por região, peso, dimensão, transportadora. Correios com prazos não cumpridos. Reclamações de cliente por atraso.
- **Catálogo pesado e desatualizado:** 500+ SKUs com fotos, descrições, variações (cor, tamanho) — atualizar tudo em 3 plataformas é inviável manualmente.
- **Pós-venda e devoluções:** Processo de troca/devolução é manual, sem automação de código de rastreio, sem estorno automático.
- **Gestão de pedidos multicanal:** Cada marketplace tem interface própria. Vendedor precisa logar em 5 painéis diferentes.

### Dores Fiscais e de Compliance
- **NF-e para cada pedido:** Obrigação fiscal por venda, mas integração marketplace→nota é falha ou inexistente em muitas plataformas.
- **ICMS interestadual:** Diferencial de alíquota (DIFA) e ICMS partilha para vendas intermunicipais/interestaduais — cálculo automático é raro.
- **ST e IPI em e-commerce:** Regras tributárias por NCM que mudam por estado e origem do produto.
- **Declarações fiscais acumuladas:** SPED, GIA, DCTF — e-commercistas acumulam obrigações sem saber.

### Dores Financeiras
- **Taxas de marketplace que corroem margem:** 16-20% de comissão + 3-5% de gateway = 20-25% do faturamento vai para plataformas.
- **Receita diluída em 5+ canais:** Dinheiro espalhado em iFood, Mercado Pago, PagSeguro, Stripe, PayPal — sem visibilidade consolidada.
- **Conciliação impossível:** Cada canal paga em dia diferente, com taxa diferente, descontando comissão. Conciliar é pesadelo.
- **Capital de giro apertado:** Compra de estoque antecipada + prazo de recebimento de 14-30 dias = buraco de caixa.

### Dores de Gestão
- **Tráfego pago como vício:** 60-70% dos e-commercistas dependem de Google Ads/Meta Ads. Custo por clique só sobe.
- **Falta de CRM:** Não sabe quem é o cliente, qual a LTV, quando compra de novo. Remarketing no escuro.
- **Marketplace como dono do cliente:** O cliente é do Mercado Livre, não do vendedor. Sem captação própria.
- **SKU explosion:** Mesmo produto em 5 variações de cor × 4 tamanhos = 20 SKUs para gerenciar fotos, estoque, preço em 3 canais.

## Observações
- Tendência para comércio unificado (omnichannel) e integração com PDV físico.
- Importante considerar PCI DSS, LGPD e conformidade fiscal brasileira (SPED).
- Muitos oferecem planos gratuitos ou de teste com limites de produtos/vendas.