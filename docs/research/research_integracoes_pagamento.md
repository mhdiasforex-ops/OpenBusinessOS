# Integrações de Pagamento Brasileiras — Pesquisa para o BusinessOS

**Versão:** 1.0  
**Data:** 23/05/2026  
**Fontes:** Sites oficiais, documentação API, G2/Capterra, Reclame Aqui

---

## Visão Geral

Pesquisa de gateways e plataformas de pagamento brasileiras para integração com o módulo Financeiro do BusinessOS. Foco em: cobertura de meios de pagamento, qualidade da API, custo para MPEs, e compliance.

---

## 1. Mercado Pago

**Site:** https://www.mercadopago.com.br  
**Tipo:** Gateway completo + carteira digital  
**Meios de Pagamento:** Boleto, PIX, cartão crédito (até 12x), cartão débito, saldo MP, assinaturas recorrentes, link de pagamento, QR Code presencial  
**Precificação:**
- PIX: 0,99% (recebimento imediato)
- Boleto: R$ 3,49 por boleto
- Cartão crédito: 4,99% (1x) a 5,89% (12x)
- Assinaturas: +0% sobre taxa de cartão
- Marketplace split: +1,99% por seller
**API:** REST (JSON), SDKs PHP/Node/Python/Java/.NET/Ruby, Webhooks completos  
**Compliance PCI:** Nível 1 (certificado)  
**Prazos Recebimento:**
- PIX: imediato
- Boleto: 1-2 dias úteis após pagamento
- Cartão: 30 dias (ou antecipação com desconto 2-4%/mês)
**Adequação MPE:** Excelente — taxa de entrada baixa, documentação boa, chat suporte  
**Pontos Fortes:** Cobrança PIX mais barata do mercado, carteira digital, split marketplace, Checkout Pro/Custom  
**Pontos Fracos:** Taxa de cartão acima da média, antecipação cara, suporte pode ser lento, bloqueios de conta por fraude são comuns

---

## 2. PagSeguro

**Site:** https://pagseguro.uol.com.br  
**Tipo:** Gateway completo + carteira digital  
**Meios de Pagamento:** Boleto, PIX, cartão crédito (até 18x), cartão débito, saldo PagSeguro, assinaturas, link de pagamento, maquininha física  
**Precificação:**
- PIX: 1,99%
- Boleto: R$ 3,00 por boleto
- Cartão crédito: 4,99% (1x) a 6,99% (18x)
- Maquininha: 1,99% (débito) a 4,99% (crédito 1x)
- Assinaturas: mesma taxa cartão
**API:** REST (JSON), SDKs PHP/Node/Java/.NET/C#, Webhooks, Checkout Transparente  
**Compliance PCI:** Nível 1  
**Prazos Recebimento:**
- PIX: imediato
- Boleto: 1-2 dias
- Cartão: 30 dias (ou D+0 com maquininha)  
**Adequação MPE:** Boa — maquininha física é diferencial para varejo, taxas competitivas para débito  
**Pontos Fortes:** Maquininha física + online no mesmo painel, débito presencial barato, conta gratuita  
**Pontos Fracos:** PIX mais caro que MP, taxa cartão parcelado alta, interface painel desatualizada

---

## 3. Stone

**Site:** https://www.stone.com.br  
**Tipo:** Gateway + maquininha (acquirer)  
**Meios de Pagamento:** Cartão crédito/débito (presencial), PIX, boleto, link de pagamento, assinaturas  
**Precificação:**
- PIX: 1,99% (ou negociável)
- Boleto: R$ 3,49
- Cartão crédito: 4,99% (1x) — negociável por volume
- Cartão débito: 1,99%
- Antecipação: 1,49%/mês (mais barata do mercado)
**API:** REST (JSON), SDK Node/Java, Webhooks, Stone Hub (dashboard)  
**Compliance PCI:** Nível 1 (acquirer direto = sem intermediário)  
**Prazos Recebimento:**
- D+0 para débito
- D+30 crédito (ou antecipação 1,49%/mês — mais barata)  
**Adequação MPE:** Boa para volume — taxas negociáveis, antecipação mais barata  
**Pontos Fortes:** Antecipação mais barata, acquirer direto (sem intermediary), taxas negociáveis por volume, contaStone (banking)  
**Pontos Fracos:** PIX/boleto não é o core, API menor que MP/PagSeguro, ecosystem menor, foco em médio/grande

---

## 4. Cielo

**Site:** https://www.cielo.com.br  
**Tipo:** Acquirer + gateway (Cielo eCommerce)  
**Meios de Pagamento:** Cartão crédito/débito (presencial e online), PIX, boleto, QR Code, assinaturas (Cielo Recorrência)  
**Precificação:**
- PIX: 1,99% (Cielo PIX)
- Boleto: R$ 3,50
- Cartão crédito: 4,99% (1x) — negociável
- Cartão débito: 2,00%
- Antecipação: 2,49%/mês (padrão)
**API:** REST (JSON), SDKs C#/Java/PHP, Webhooks, Cielo eCommerce API 3.0  
**Compliance PCI:** Nível 1 (maior acquirer do Brasil)  
**Prazos Recebimento:**
- Débito: D+1
- Crédito: D+30 (ou antecipação)  
**Adequação MPE:** Média — boa para quem já usa maquininha Cielo, API e-commerce é boa mas documentação é fragmentada  
**Pontos Fortes:** Maior acquirer BR, aceita Amex/JCB/Hipercard/Elite, Cielo Recorrência boa para assinaturas  
**Pontos Fracos:** Documentação API confusa, antecipação cara, taxas menos competitivas que Stone para volume, suporte lento

---

## 5. Asaas

**Site:** https://www.asaas.com  
**Tipo:** Plataforma de cobrança (não é gateway de cartão)  
**Meios de Pagamento:** Boleto, PIX, cartão crédito (via parceiro), link de pagamento, assinaturas recorrentes, cobrança com registro, split de pagamento  
**Precificação:**
- PIX: 0,99%
- Boleto: R$ 3,49 (com registro R$ 4,49)
- Cartão crédito: 4,99% (1x) a 5,99% (6x)
- Assinaturas: mesma taxa + R$ 1,00/assinatura/mês
- Split: 0,99% por recebedor
**API:** REST (JSON), excelente documentação, SDKs Node/PHP/Python/Java, Webhooks completos, API sandbox  
**Compliance PCI:** Nível 1 (via parceiro)  
**Prazos Recebimento:**
- PIX: imediato
- Boleto: D+1 após pagamento
- Cartão: D+28 (ou antecipação 2,5%/mês)  
**Adequação MPE:** Excelente — foco em cobrança/cobrância é exatamente a dor de MPEs de serviços  
**Pontos Fortes:** Melhor API do mercado (documentação, sandbox, webhooks), cobrança recorrente nativa, split de pagamento, modelo white-label, gestão de inadimplência  
**Pontos Fracos:** Não é acquirer (cartão via parceiro), antecipação cara, sem maquininha física, sem carteira digital

---

## 6. Iugu

**Site:** https://www.iugu.com  
**Tipo:** Plataforma de cobrança (similar Asaas)  
**Meios de Pagamento:** Boleto, PIX, cartão crédito, assinaturas recorrentes, link de pagamento, split  
**Precificação:**
- PIX: 1,99%
- Boleto: R$ 3,49
- Cartão crédito: 4,99% (1x) a 5,99% (12x)
- Assinaturas: mesma taxa
- Split: 1,99% por recebedor
**API:** REST (JSON), documentação boa, SDKs PHP/Node/Python/Ruby, Webhooks  
**Compliance PCI:** Nível 1 (via parceiro)  
**Prazos Recebimento:**
- PIX: imediato
- Boleto: D+1
- Cartão: D+30  
**Adequação MPE:** Boa — alternativa ao Asaas com foco em SaaS/assinaturas  
**Pontos Fortes:** Foco em SaaS recorrente, split de pagamento, API estável, white-label  
**Pontos Fracos:** Documentação inferior ao Asaas, comunidade menor, PIX mais caro

---

## 7. Zoop

**Site:** https://www.zoop.com.br  
**Tipo:** Plataforma de pagamentos (white-label para marketplaces)  
**Meios de Pagamento:** PIX, boleto, cartão crédito/débito, assinaturas, split multi-seller  
**Precificação:**
- Custom (negociável por volume)
- Média: PIX 1,5%, boleto R$ 3,00, cartão 5%
**API:** REST (JSON), SDKs, Webhooks, foco em marketplace/platform  
**Compliance PCI:** Nível 1  
**Prazos Recebimento:** Negotiable  
**Adequação MPE:** Baixa — foco em marketplaces/platforms, não MPE individual  
**Pontos Fortes:** White-label completo, split avançado, KYC/KYB integrado, banking-as-a-service  
**Pontos Fracos:** Complexo para MPEs simples, sem plano padrão (tudo negociável), documentação limitada

---

## 8. PagHiper

**Site:** https://www.paghiper.com.br  
**Tipo:** Gateway de boleto/PIX  
**Meios de Pagamento:** Boleto (com registro), PIX, notificação automática de pagamento  
**Precificação:**
- PIX: 1,99%
- Boleto: R$ 1,99 (mais barato do mercado)
- Boleto com registro: R$ 2,99
**API:** REST (JSON), SDKs PHP/Node, Webhooks, integração bancária direta  
**Compliance PCI:** N/A (não processa cartão)  
**Prazos Recebimento:** D+1  
**Adequação MPE:** Boa para quem só precisa boleto/PIX — mais barato para boletos  
**Pontos Fortes:** Boleto mais barato do mercado, notificação automática de pagamento, integração direta com bancos, suporte humanizado  
**Pontos Fracos:** Sem cartão crédito, sem assinaturas recorrentes, funcionalidades limitadas

---

## 9. Wirecard/Moip

**Site:** https://www.wirecard.com.br (descontinuado como Moip)  
**Status:** PARCIALMENTE DESCONTINUADO — marca Moip foi absorvida pela Wirecard que reduziu operações no BR  
**Adequação MPE:** Não recomendado — instabilidade operacional, saída gradual do mercado BR

---

## Comparativo de Precificação

| Gateway | PIX | Boleto | Cartão 1x | Cartão 12x | Antecipação |
|---|---|---|---|---|---|
| Mercado Pago | 0,99% | R$ 3,49 | 4,99% | 5,89% | 2-4%/mês |
| PagSeguro | 1,99% | R$ 3,00 | 4,99% | 6,99% | N/A |
| Stone | 1,99% | R$ 3,49 | 4,99% | neg. | 1,49%/mês |
| Cielo | 1,99% | R$ 3,50 | 4,99% | neg. | 2,49%/mês |
| Asaas | 0,99% | R$ 3,49 | 4,99% | 5,99% | 2,5%/mês |
| Iugu | 1,99% | R$ 3,49 | 4,99% | 5,99% | N/A |
| PagHiper | 1,99% | R$ 1,99 | N/A | N/A | N/A |
| Zoop | ~1,5% | ~R$ 3,00 | ~5% | neg. | neg. |

---

## Comparativo de Funcionalidades

| Funcionalidade | MP | PagSeguro | Stone | Cielo | Asaas | Iugu | PagHiper |
|---|---|---|---|---|---|---|---|
| PIX | Sim | Sim | Sim | Sim | Sim | Sim | Sim |
| Boleto | Sim | Sim | Sim | Sim | Sim | Sim | Sim |
| Cartão Crédito | Sim | Sim | Sim | Sim | Via parceiro | Via parceiro | Não |
| Cartão Débito | Sim | Sim | Sim | Sim | Não | Não | Não |
| Assinaturas | Sim | Sim | Sim | Sim | Sim | Sim | Não |
| Split | Sim | Sim | Sim | Não | Sim | Sim | Não |
| Maquininha | Não | Sim | Sim | Sim | Não | Não | Não |
| Carteira Digital | Sim | Sim | Sim (banking) | Não | Não | Não | Não |
| White-label | Não | Não | Não | Não | Sim | Sim | Não |
| Link Pagamento | Sim | Sim | Sim | Sim | Sim | Sim | Não |
| API Sandbox | Sim | Sim | Sim | Sim | Sim | Sim | Não |
| Webhooks | Sim | Sim | Sim | Sim | Sim | Sim | Sim |

---

## Recomendação de Arquitetura para o BusinessOS

### Strategy: Abstração + Multi-Gateway

O BusinessOS deve implementar uma **camada de abstração de pagamentos** (PaymentProvider interface) com adapters para cada gateway. O usuário escolhe qual gateway usar (ou usa múltiplos).

### Integrações Prioritárias

**Fase 1 (Core):**
1. **Asaas** — Melhor API, foco em cobrança/cobrância (dor #1 de MPEs de serviços), PIX barato, assinaturas nativas, white-label
2. **Mercado Pago** — PIX mais barato (0,99%), carteira digital, maior base de usuários

**Fase 2 (Expansão):**
3. **PagSeguro** — Maquininha física + online (varejo)
4. **Stone** — Antecipação mais barata, acquirer direto (volume)
5. **PagHiper** — Boleto mais barato (para MPEs que só usam boleto/PIX)

**Fase 3 (Enterprise):**
6. **Cielo** — Maiores volumes, Amex/Hipercard
7. **Iugu** — Alternativa Asaas para SaaS
8. **Zoop** — Marketplace split avançado

### Padrão de Design

```typescript
interface PaymentProvider {
  createCharge(data: CreateChargeDto): Promise<Charge>;
  getChargeStatus(id: string): Promise<ChargeStatus>;
  cancelCharge(id: string): Promise<void>;
  createSubscription(data: CreateSubscriptionDto): Promise<Subscription>;
  processWebhook(payload: any, signature: string): Promise<WebhookResult>;
  getBalance(): Promise<Balance>;
  requestTransfer(data: TransferDto): Promise<Transfer>;
}
```

Cada gateway implementa esta interface. O módulo Financeiro do BusinessOS usa o provider configurado pelo tenant.

---

*Pesquisa concluída em: 23/05/2026*
