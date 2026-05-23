# WhatsApp Business API e Integrações de Comunicação — Pesquisa para o BusinessOS

**Versão:** 1.0  
**Data:** 23/05/2026  
**Fontes:** Meta Business, documentação oficial, provedores BSP, G2

---

## Visão Geral

O WhatsApp é o canal de comunicação #1 no Brasil (presente em 99% dos smartphones). Para MPEs brasileiras, WhatsApp não é só chat — é canal de vendas, agendamento, cobrança e suporte. O BusinessOS precisa ter integração WhatsApp nativa em todos os módulos verticais.

---

## 1. WhatsApp Business API — Oficial (Meta)

**Site:** https://business.whatsapp.com/developers/developer-hub  
**Tipo:** API oficial da Meta para empresas  
**Disponibilidade:** Via BSP (Business Solution Provider) ou direto (apenas grandes volumes)

### Modelos de Acesso

| Modelo | Requisito | Custo | Complexidade |
|---|---|---|---|
| **WhatsApp Business App** (gratuito) | Smartphone | Free | Baixa (manual) |
| **WhatsApp Business API via BSP** | Conta BSP + número dedicado | R$ 200-2000/mês | Média |
| **WhatsApp Business API Direto** | Empresa validada pela Meta + volume alto | Sob consulta | Alta |
| **Cloud API (Meta)** | App Facebook Developer | Por conversa (US$ 0.01-0.10) | Média |

### Cloud API (Meta) — Preços por Conversa (2025-2026)

| Categoria | Preço (BR) | Janela |
|---|---|---|
| **User-initiated** (resposta) | Free | 24h após msg do usuário |
| **Business-initiated (Utility)** | US$ 0.02 | 24h |
| **Business-initiated (Authentication)** | US$ 0.01 | 24h |
| **Business-initiated (Marketing)** | US$ 0.06 | 24h |
| **Business-initiated (Service)** | Free | Dentro da janela de 24h |

**NOTA:** Primeiras 1.000 conversas/mês são gratuitas (Meta free tier).

### Funcionalidades da API
- Envio/recebimento de mensagens texto, imagem, vídeo, documento, áudio, localização, contato
- Templates de mensagem (pré-aprovados pela Meta) — para mensagens fora da janela de 24h
- Mensagens interativas (botões, listas, formulários)
- Catalogo de produtos (até 500 itens)
- Pagamentos via WhatsApp (BR: parceiro Mercado Pago — piloto)
- Multi-agente (até 50 agentes por número)
- Webhooks para eventos (message, status, reaction)
- Labels/tags para organização de conversas
- QR Code e link direto (wa.me/5511999999999)

### Limitações
- Número dedicado (não pode ser o mesmo do app pessoal)
- Templates precisam de aprovação da Meta (24-48h)
- Janela de 24h para respostas gratuitas
- Sem API de grupo (não é possível gerenciar grupos via API)
- Compliance: proibido spam, opt-in obrigatório, bloqueio por violação
- Não suporta chamadas de voz/vídeo via API

---

## 2. BSPs (Business Solution Providers) — Provedores Autorizados

BSPs são intermediários autorizados pela Meta que facilitam acesso à API. Importante para MPEs que não querem lidar com infraestrutura.

### Principais BSPs no Brasil

| BSP | Modelo | Preço Entry | Recursos | Foco |
|---|---|---|---|---|
| **Zenvia** | SaaS | R$ 299/mês | Multi-canal (WA, SMS, IG, Email) | Corporativo |
| **Wati** | SaaS | US$ 49/mês | Chatbot builder, CRM, team inbox | PMEs |
| **Take (Blip)** | SaaS | R$ 500+/mês | Chatbot IA, omnichannel, analytics | Enterprise |
| **360dialog** | API-only | €99/mês | API pura, sem interface | Developers |
| **Twilio** | Pay-per-use | ~US$ 0.005/msg | API global, multi-canal | Developers |
| **Evolution API** | Open source | Free (self-host) | API REST, multi-instância | Comunidade BR |
| **ChatAPI** | Open source | Free (self-host) | Similar ao Evolution | Comunidade |
| **Baileys** | Lib Node.js | Free | Web scraping WA Web | Comunidade |

### Comparativo BSPs

**Para o BusinessOS, a melhor abordagem é multi-camada:**

1. **Cloud API direta (Meta)** — para MPEs que querem o mais barato e são tech-savvy
2. **Evolution API (self-hosted)** — para on-premise / custo zero
3. **360dialog/Twilio** — para SaaS gerenciado sem BSP completo
4. **Zenvia/Wati** — para MPEs que querem solução completa com interface

---

## 3. Evolution API — Open Source (Relevante para BusinessOS)

**Site:** https://github.com/EvolutionAPI/evolution-api  
**Licença:** GPLv3  
**Stack:** Node.js, TypeScript, Docker, Redis, MongoDB  
**Comunidade:** 2K+ stars, forte presença brasileira

### O que FAZ
- Multi-instância WA (múltiplos números no mesmo servidor)
- API REST para enviar/receber mensagens, grupos, contatos
- Integração com Typebot, ChatGPT, Dialogflow, n8n
- Webhook para eventos
- QR Code para pareamento
- Suporte a WhatsApp Business + Personal
- Baileys como engine subjacente
- Socket.io para tempo real

### O que NÃO FAZ
- Não é BSP oficial (usa engenharia reversa do WA Web)
- Risco de bloqueio pela Meta (não é autorizado)
- Sem SLA de uptime
- Sem suporte oficial
- Atualizações podem quebrar quando WA muda protocolo

### Adequação BusinessOS
- **Excelente para Community tier** (free, self-hosted)
- **Risco regulatório** — Meta pode bloquear instâncias não-oficiais
- **Recomendação:** usar Cloud API oficial como primary, Evolution como fallback/community

---

## 4. Casos de Uso por Nicho

### Varejo
- Catálogo de produtos via WhatsApp
- Notificação de promoções (marketing template)
- Recibo digital por WA (pós-compra)
- Suporte ao cliente (rastreamento de pedidos)
- Pesquisa de satisfação (NPS)

### E-commerce
- Notificação de pedido (confirmação, separação, envio, entrega)
- Abandono de carrinho (remarketing via WA)
- Cobrança de boleto vencido (utility template)
- Comprovante de pagamento
- Link de rastreamento Correios

### Serviços
- Agendamento/lembrete de consulta/reunião
- Confirmação de presença (botão sim/não)
- Orçamento enviado por WA
- Cobrança recorrente (lembrete de vencimento)
- Pós-venda (research de satisfação)

### Alimentação
- Cardápio digital via WA
- Pedido delivery via WA (chatbot com menu interativo)
- Confirmação de pedido + tempo estimado
- Programa de fidelidade (stamp card digital)
- Reserva de mesa

### Construção
- Atualização de obra (foto + relatório periódico ao cliente)
- Orçamento de materiais
- Lembrete de pagamento (faturaobra)
- Agenda de visitas técnicas
- ART/RRT enviado por WA

### Saúde
- Agendamento/lembrete de consulta (MAIOR caso de uso)
- Confirmação 24h antes (reduce no-show em 30-50%)
- Resultado de exame por WA (link seguro — não enviar resultado direto por LGPD)
- Receita digital por WA
- Pós-consulta (evolução, retorno)
- **IMPACTO:** Reduz no-show de 20-30% para 5-10%

### Educação
- Cobrança de mensalidade (lembrete vencimento)
- Atestado de frequência por WA
- Comunicado para pais (reunião, evento)
- Boletim/notas
- Lembrete de matrícula/renovação

### Profissionais Liberais
- Agendamento por WA (link Calendly/ou fixo)
- Cobrança de honorários
- Documentos (contrato, NFS-e, recibo)
- Lembrete de prazos (advocacia)
- Portal do cliente via WA (status)

---

## 5. Integrações com Chatbots/IA

| Plataforma | Tipo | Preço | Integração WA |
|---|---|---|---|
| **Typebot** | Open source chatbot builder | Free (self-host) | Evolution API |
| **Botpress** | Chatbot IA | Free tier + paid | Cloud API |
| **Dialogflow (Google)** | NLU/IA | Free tier + paid | Via BSP ou webhook |
| **ChatGPT API** | LLM | Pay-per-token | Via Evolution API |
| **n8n** | Workflow automation | Free (self-host) | Evolution API |
| **Make (Integromat)** | Workflow automation | Free tier + paid | Cloud API |

### Cenário Recomendado para BusinessOS
- **n8n self-hosted** como engine de automação
- **Typebot** como builder de chatbots visuais
- **Evolution API** como bridge WhatsApp
- **ChatGPT API** como assistente inteligente

---

## 6. Arquitetura de Integração para o BusinessOS

### Camada 1: WhatsApp Adapter (Interface)

```typescript
interface WhatsAppProvider {
  sendMessage(to: string, content: MessageContent): Promise<MessageId>;
  sendTemplate(to: string, template: TemplateDto): Promise<MessageId>;
  sendInteractive(to: string, interactive: InteractiveDto): Promise<MessageId>;
  onMessage(callback: (msg: IncomingMessage) => void): void;
  onStatus(callback: (status: MessageStatus) => void): void;
  getQRCode(): Promise<string>;
  getInstanceStatus(): Promise<InstanceStatus>;
}
```

### Camada 2: Implementações

| Adapter | Provedor | Custo | Uso |
|---|---|---|---|
| `MetaCloudApiAdapter` | Cloud API oficial | ~US$ 0.01-0.06/conversa | SaaS (pago) |
| `EvolutionApiAdapter` | Evolution API | Free (self-host) | Community (free) |
| `TwilioAdapter` | Twilio | ~US$ 0.005/msg | Enterprise |
| `ZenviaAdapter` | Zenvia | R$ 299+/mês | Enterprise BR |

### Camada 3: Serviços de Negócio

| Serviço | Nichos | Templates Necessários |
|---|---|---|
| `AppointmentReminder` | Saúde, Serviços, Estética | `agendamento_confirmar` |
| `PaymentReminder` | Todos | `cobranca_vencimento` |
| `OrderNotification` | Varejo, E-commerce, Alimentação | `pedido_status` |
| `DocumentDelivery` | Todos | `documento_disponivel` |
| `SurveyRequest` | Todos | `pesquisa_satisfacao` |
| `DeadlineAlert` | Advocacia, Construção | `prazo_alerta` |

### Fluxo de Mensagem Típica

```
[BusinessOS Event] → [Workflow Engine] → [WhatsApp Service]
                                                ↓
                                          [Template Manager] (cache de templates aprovados)
                                                ↓
                                          [WhatsApp Adapter] → [Meta Cloud API / Evolution]
                                                ↓
                                          [Webhook Receiver] → [BusinessOS DB]
```

---

## Priorização de Implementação

### Fase 1 (Core)
1. **Meta Cloud API adapter** — oficial, estável, free tier 1K conversas
2. **Serviço de lembrete de agendamento** — impacto direto em no-show (saúde/serviços)
3. **Serviço de lembrete de cobrança** — impacto direto em inadimplência (todos os nichos)
4. **Templates pré-aprovados** — biblioteca de templates por nicho

### Fase 2 (Expansão)
5. **Evolution API adapter** — para Community tier self-hosted
6. **Chatbot básico** — Typebot + Evolution para auto-atendimento
7. **Catálogo de produtos via WA** — varejo/e-commerce
8. **Pedido delivery via WA** — alimentação

### Fase 3 (IA)
9. **Assistente IA** — ChatGPT para respostas automáticas contextuais
10. **Automação n8n** — workflows cross-sistema

---

*Pesquisa concluída em: 23/05/2026*
