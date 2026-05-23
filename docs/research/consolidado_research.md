# Consolidado de Pesquisas — BusinessOS

## Visão Geral
Este documento consolida as pesquisas realizadas sobre o mercado de software de gestão para MPEs brasileiras, com foco no posicionamento do BusinessOS. Cobertura: **8 nichos + 10 subnichos + 5 ERPs open source + 20 APIs públicas + 8 gateways de pagamento + precificação por nicho + 7 conselhos de classe + WhatsApp Business API + canal de contadores + UX/onboarding benchmark + 23 concorrentes de subnichos**.

**Última atualização:** 23/05/2026 (v4 — +dores e problemas comuns por nicho)

---

## Sumário Executivo

O mercado brasileiro de software de gestão para MPEs é fragmentado por nicho e por funcionalidade. Nenhum produto atende simultaneamente gestão operacional (por nicho) + gestão fiscal (NF-e, NFS-e, SPED) + gestão financeira + CRM/captação + RH. O BusinessOS se posiciona como o **primeiro ERP open source horizontal com módulos verticais ativáveis por nicho**, eliminando a fragmentação que é a maior dor das MPEs brasileiras.

**Novidade v3:** Compliance por 7 conselhos de classe (CRM, CFO, OAB, CREA, CAU, CRC, CRECI) — nenhum tem API pública, validação manual. WhatsApp Business API mapeada com 8 BSPs e Evolution API open source. Contadores como canal GTM (CAC 3-8x menor que ads, churn 2-3x menor). UX/onboarding benchmark — TTV ideal < 10 min, wizard por nicho. 23 concorrentes de subnichos analisados — **padrão universal: vertical forte, horizontal inexistente** (nenhum tem NF-e/SPED/folha/CRM).

---

## Nichos Principais (8/8)

### 1. Varejo
**Concorrentes:** Linx, TOTVS RMS, SAP Business One, Microvix, Bematech, ContaAzul, Omie, Bling
**Funcionalidades Comuns:** NF-e/NFC-e, estoque básico, gestão de clientes, relatórios, integração pagamentos
**Lacuna:** Complexidade/custo para microempreendedores; CRM inexistente nos ERPs BR
**WTP:** R$ 79-499/mês (média R$ 199)
**Arquivo:** `research_varejo.md`

### 2. E-commerce
**Concorrentes:** Nuvemshop, Tray, VTEX, Loja Integrada, Shopify, Magento, Woocommerce
**Funcionalidades Comuns:** Vitrine online, estoque, pagamentos, frete, notas fiscais, relatórios
**Lacuna:** Escalabilidade, custo módulos avançados, fiscal limitado
**WTP:** R$ 69-349/mês (média R$ 179)
**Arquivo:** `research_ecommerce.md`

### 3. Serviços
**Concorrentes:** TOTVS RM, SAP B1, Senior, PipeRun, HubSpot, Zoho One, ContaAzul, Omie
**Funcionalidades Comuns:** Gestão de clientes, finanças, NFS-e, tarefas/projetos, relatórios
**Lacuna:** Custo/complexidade ERPs; escopo limitado CRMs puros
**WTP:** R$ 49-599/mês (média R$ 199)
**Arquivo:** `research_servicos.md`

### 4. Alimentação
**Concorrentes:** Microsiga, Sankhya, Restaurante Fácil, ChefHero, iFood for Business, Menu
**Funcionalidades Comuns:** Controle mesas/comandas, cardápio, pagamentos, NFC-e, estoque, delivery
**Lacuna:** Subnichos específicos, dependência delivery, hardware específico
**WTP:** R$ 149-600/mês (média R$ 299)
**Arquivo:** `research_alimentacao.md`

### 5. Construção
**Concorrentes:** Projeto, Obra Prima, QualiSystems, Blok, Construlink, TOTVS
**Funcionalidades Comuns:** Gestão de obras, orçamentação, medição, compra de materiais, RH obra
**Lacuna:** Complexidade para pequenas construtoras, falta de integração fiscal
**WTP:** R$ 149-1000/mês (média R$ 399)
**Arquivo:** `research_construcao.md`

### 6. Saúde (Clínicas e Consultórios)
**Concorrentes:** iClinic, Doctoralia, Feegow, MV Sistemas, Interact, SoftMed
**Funcionalidades Comuns:** Agenda médica, prontuário eletrônico, financeiro, convênios, WhatsApp, LGPD
**Lacuna:** Fragmentação prontuário-financeiro-fiscal; TISS complexa para MPEs
**WTP:** R$ 149-699/mês (média R$ 299)
**Arquivo:** `research_saude.md`

### 7. Educação (Escolas e Cursos)
**Concorrentes:** Sponte, ClassApp, GVdasa, Eskolare, iEducar, QMágica
**Funcionalidades Comuns:** Matrículas/turmas, frequência/notas, mensalidades, portal, comunicação
**Lacuna:** Fragmentação pedagógico-financeiro-fiscal; inadimplência; sem LMS integrado
**WTP:** R$ 197-797/mês (média R$ 349)
**Arquivo:** `research_educacao.md`

### 8. Profissionais Liberais
**Concorrentes:** ContaAzul, Nibo, Omie, Bling, Asaas, Domínio, Aurum, HubSpot, Zoho
**Funcionalidades Comuns:** Financeiro, NFS-e, cobrança, integração contador, relatórios, app
**Lacuna:** Sem módulos por profissão; conformidade conselhos inexistente; CRM ausente nos ERPs
**WTP:** Free-R$ 299/mês (média R$ 99)
**Arquivo:** `research_profissionais_liberais.md`

---

## Subnichos (10 mapeados)

| Subnicho | Nicho Pai | Software Específico | Funcionalidade Chave | Prioridade |
|---|---|---|---|---|
| Odontologia | Saúde | Dental Office, Doctor Dente | Odontograma + convênios | Fase 2 |
| Veterinária | Saúde | Vetor, PetLovers, SimplesVet | Duplo cadastro tutor/pet | Fase 3 |
| Estética/Beleza | Serviços | Fresha, SalaoVIP, Smartline | Agendamento + comissão | **Fase 1** |
| Fisioterapia | Saúde | FisioWork, FisioVida | Pacotes de sessões + convênios | Fase 2 |
| Psicologia | Saúde | ZenPsi, PsicoOffice | Agendamento recorrente + NFS-e | **Fase 1** |
| Idiomas | Educação | Txell, Spirit, ClassApp | Matrícula por módulo + progresso | Fase 3 |
| Música | Educação | Music School Manager | Agendamento salas + aluguel instrumentos | Fase 3 |
| Cursinhos | Educação | QMágica, Professor Online | Simulados + ranking + material digital | Fase 2 |
| EAD | Educação | Moodle, Canvas, Hotmart | LMS + certificados + afiliados | Fase 3 |
| Academias | Serviços | Gympass, InSport | Mensalidade recorrente + catraca | Fase 2 |
| Oficinas | Serviços | OficinaNet, AutoFix | OS + estoque por veículo + histórico | Fase 2 |
| Advocacia | Prof. Liberais | Domínio, Aurum, Lawsoft | Prazos + time tracking + honorários | **Fase 1** |
| Contabilidade | Prof. Liberais | Domínio, Alterdata, Contabil XP | SPED + folha + IRPF | **Canal** |

**Arquivo:** `research_subnichos.md`

---

## ERPs Open Source Internacionais (5 analisados)

| ERP | Stack | Comunidade | Marketplace | Localização BR | Vertical Nicho | Licença |
|---|---|---|---|---|---|---|
| **Odoo** | Python/PG | 50K+ | 30K+ apps | Fraca (OCA) | Via apps | LGPL+EE |
| **ERPNext** | Python(Frappe)/MariaDB | 3K+ | Poucos | Inexistente | Saúde/Edu built-in | GPL |
| **Dolibarr** | PHP/MySQL | 500 | Nenhum | Inexistente | Nenhuma | GPL |
| **Tryton** | Python/PG | 200 | Nenhum | Inexistente | Nenhuma | GPL |
| **iDempiere** | Java(OSGi)/PG | 100 | Nenhum | Parcial LATAM | Nenhuma | GPL |

**Lições para o BusinessOS:**
- COPAR: Modularidade via plugins (Odoo), verticais built-in (ERPNext), ativação por perfil (Dolibarr), meta-dados configuráveis (iDempiere), hook system (todos)
- EVITAR: ORM custom, stack proprietária, monolito sem limites, desktop-first, licença copyleft
- DIFERENCIAL: Stack moderna (NestJS/Prisma/Next.js), localização fiscal BR nativa, 8 nichos BR verticais, open source permissivo

**Arquivo:** `research_erps_opensource.md`

---

## APIs Públicas Brasileiras (20 mapeadas)

### Crítico (Fase 1)
| API | Dados | Utilidade |
|---|---|---|
| BrasilAPI CEP | Endereços | Autopreenchimento |
| BrasilAPI/ReceitaWS CNPJ | Dados empresa | Validação/autofill |
| IBGE Municípios | Código IBGE | NF-e/SPED |
| BACEN PTAX | Câmbio | Conversão moeda |

### Importante (Fase 2)
| API | Dados | Utilidade |
|---|---|---|
| SEFAZ Webservice | NF-e | Emissão/consulta fiscal |
| e-Social Webservice | Eventos trabalhistas | RH/folha compliance |
| SPED (geração) | Layouts EFD/ECD | Arquivos fiscais |
| BrasilAPI NCM/CFOP | Classificação fiscal | NF-e automática |

### Futuro (Fase 3)
| API | Dados | Utilidade |
|---|---|---|
| CNES | Estabelecimentos saúde | Módulo Saúde |
| MEC/INEP | Escolas | Módulo Educação |
| Open PNCP | Licitações | Vendas governo |
| DataSUS | Dados saúde | Dashboards |

**Arquivo:** `research_apis_publicas.md`

---

## Integrações de Pagamento (8 analisadas)

| Gateway | PIX | Boleto | Cartão 1x | Melhor Para |
|---|---|---|---|---|
| **Asaas** | 0,99% | R$ 3,49 | 4,99% | Cobrança/cobrância (Fase 1) |
| **Mercado Pago** | 0,99% | R$ 3,49 | 4,99% | PIX + carteira (Fase 1) |
| **PagSeguro** | 1,99% | R$ 3,00 | 4,99% | Varejo físico (Fase 2) |
| **Stone** | 1,99% | R$ 3,49 | 4,99% | Volume + antecipação (Fase 2) |
| **PagHiper** | 1,99% | R$ 1,99 | N/A | Só boleto/PIX (Fase 2) |
| **Cielo** | 1,99% | R$ 3,50 | 4,99% | Enterprise (Fase 3) |
| **Iugu** | 1,99% | R$ 3,49 | 4,99% | SaaS alternativo (Fase 3) |
| **Zoop** | ~1,5% | ~R$ 3 | ~5% | Marketplace (Fase 3) |

**Arquitetura recomendada:** Interface `PaymentProvider` com adapters por gateway. Tenant escolhe provedor.

**Arquivo:** `research_integracoes_pagamento.md`

---

## Precificação — Disposição a Pagar por Nicho

| Nicho | Faixa MPE (R$/mês) | WTP Médio | Modelo Preferido |
|---|---|---|---|
| Varejo | R$ 79 - 499 | R$ 199 | Flat |
| E-commerce | R$ 69 - 349 | R$ 179 | Flat + transação |
| Serviços | R$ 49 - 599 | R$ 199 | Flat ou por user |
| Alimentação | R$ 149 - 600 | R$ 299 | Flat |
| Construção | R$ 149 - 1000 | R$ 399 | Flat |
| Saúde | R$ 149 - 699 | R$ 299 | Por usuário |
| Educação | R$ 197 - 797 | R$ 349 | Flat ou por aluno |
| Prof. Liberais | Free - 299 | R$ 99 | Freemium + flat |

**Média geral MPE brasileira:** R$ 100-300/mês

### Precificação Proposta BusinessOS

| Tier | Preço | Inclui | Target |
|---|---|---|---|
| Community | Free | Financeiro + CRM básico + 1 user | MEI, autônomos |
| Starter | R$ 79/mês | + Fiscal (NF-e) + 2 users | Microempresas |
| Business | R$ 199/mês | + RH + todos core + 5 users | Pequenas empresas |
| Professional | R$ 399/mês | + módulos verticais + 10 users | MPEs em nicho |
| Enterprise | R$ 799/mês | + API + multi-org + ilimitado | Médias empresas |

+ Marketplace de plugins: R$ 29-99/mês por módulo vertical

**Arquivo:** `research_precificacao.md`

---

## Análise Transversal — Lacunas Presentes em TODOS os Nichos

### 1. Fragmentação Fiscal-Operacional
Nenhum nicho tem software que una operações específicas do setor com emissão completa de notas fiscais e compliance. Sempre precisa de 2+ sistemas.

### 2. CRM/Captação Inexistente nos ERPs Brasileiros
ERPs fazem gestão, não fazem captação. CRMs fazem captação, não fazem fiscal. **Oportunidade universal.**

### 3. RH/Folha para MPEs é Orbital
TOTVS/Senior fazem RH mas é enterprise. MPEs usam folha separada ou planilha. **Oportunidade em todos os nichos.**

### 4. Compliance por Conselho/Órgão de Classe
Saúde (CRM, CFM), Educação (MEC, INEP), Construção (CREA, CAU), Advocacia (OAB) — nenhum ERP horizontal atende conformidade por profissão.

### 5. Open Source como Alternativa
Somente iEducar (educação pública) e Magento/Woocommerce (e-commerce) são open source. **Nenhum ERP open source completo para MPEs brasileiras existe.** Confirmado por análise de 5 ERPs open source internacionais — nenhum tem localização BR.

---

## Tendências Transversais Observadas

1. **Migração para Cloud/SaaS** — instalações locais são exceção
2. **Integração Omnichannel** — vendas físicas + digitais unificadas
3. **Automação de Workflows** — cobrança, follow-up, lembretes
4. **IA e Análise Preditiva** — previsão demanda, personalização, detecção fraudes
5. **WhatsApp como Canal de Negócio** — agendamento, cobrança, comunicação (100% dos nichos)
6. **Conformidade Regulatória** — LGPD, SPED, EFD, NF-e/NFC-e/NFS-e
7. **API-first/Marketplace** — modelo vencedor (Odoo 30K+ apps, Omie Apps)
8. **Mobile-first** — app não é opcional

---

## Recomendações Estratégicas para o BusinessOS

### Arquitetura
1. **Core horizontal + Plugins verticais:** Módulo base (financeiro, fiscal, CRM, RH) + plugins ativáveis por nicho
2. **API-first + Marketplace:** Seguir modelo Odoo — API aberta para terceiros
3. **Event-driven Architecture:** Workflows e automações cross-nicho
4. **Multi-tenant Isolado:** Essencial para SaaS
5. **PaymentProvider interface:** Abstração de gateways com adapters
6. **Meta-dados configuráveis:** Campos custom sem código (inspirado iDempiere AD)

### Funcionalidades Prioritárias (Cross-Nicho)
1. **Engine Fiscal Completa:** NF-e, NFC-e, NFS-e, CT-e, MD-e, SPED, EFD-Reinf, e-Social
2. **CRM com Funil de Vendas:** Captação com automação WhatsApp/e-mail
3. **Cobrança Automatizada:** Boleto, PIX, cartão recorrente (Asaas + MP integrados)
4. **RH Simplificado para MPEs:** Ponto, folha, férias, e-Social
5. **Dashboard/BI por Nicho:** KPIs específicos por setor
6. **WhatsApp Business API:** Canal universal

### Go-to-Market por Nicho
1. **Profissionais Liberais (fase 1):** Maior TAM, menor complexidade vertical
2. **Varejo/Serviços (fase 2):** Volume alto, NF-e/NFC-e maduras
3. **Saúde/Educação (fase 3):** Requer módulos verticais específicos
4. **Alimentação/Construção (fase 4):** Hardware + subnichos específicos

### Subnichos Prioritários (Fase 1)
1. **Estética/Beleza** — Agendamento + comissão (TAM enorme)
2. **Advocacia** — Prazos + time tracking (dor urgente)
3. **Psicologia** — Agendamento recorrente + NFS-e (alto volume)

### Canal Estratégico
- **Contadores** como canal de distribuição — recomendam BusinessOS para clientes MPEs

---

## Compliance por Conselho de Classe (7 analisados)

| Conselho | Profissão | Doc Técnico Obrigatório | API Disponível | Prioridade BusinessOS |
|---|---|---|---|---|
| **CRM** | Médico | PEP, Receita Digital | Não | Crítica (Saúde) |
| **CFO** | Odontólogo | PEP Odonto, Odontograma FDI | Não | Alta (Odontologia) |
| **OAB** | Advogado | Livro Caixa, Petição Eletrônica | Não (por tribunal) | Crítica (Advocacia) |
| **CREA** | Engenheiro | ART Eletrônica | Não | Alta (Construção) |
| **CAU** | Arquiteto | RRT Eletrônico | Não | Alta (Construção) |
| **CRC** | Contador | SPED, ECD/ECF | SPED webservice | Crítica (Canal) |
| **CRECI** | Corretor Imóveis | Contratos, Recibos | Não | Média (futuro) |

**Padrões comuns:** Registro ativo obrigatório, RT por estabelecimento, documento técnico por ato, sigilo+LGPD, certificado digital ICP-Brasil, **NENHUM tem API pública**.

**Recomendação:** Módulo de Compliance centralizado no core — cadastro de conselhos, validação de registro, gestão de docs técnicos, assinatura digital, alertas de prazo, auditoria/LGPD, templates por conselho.

**Arquivo:** `research_compliance_conselhos.md`

---

## WhatsApp Business API (8 BSPs + Evolution API)

### Canais de Acesso

| Canal | Custo | Uso BusinessOS |
|---|---|---|
| **Meta Cloud API** | Free 1K conv/mês, depois US$ 0.01-0.06/conv | SaaS (pago) |
| **Evolution API** (open source) | Free (self-host) | Community (free) |
| **Twilio** | ~US$ 0.005/msg | Enterprise |
| **Zenvia/Wati** | R$ 299-500/mês | Enterprise BR |

### Casos de Uso por Nicho (Prioridade)

| Caso de Uso | Nichos | Impacto | Fase |
|---|---|---|---|
| Lembrete de agendamento | Saúde, Serviços, Estética | Reduz no-show 30-50% | 1 |
| Lembrete de cobrança | Todos | Reduz inadimplência 20-30% | 1 |
| Status de pedido | Varejo, E-commerce, Alimentação | Satisfação + repeat | 1 |
| Alerta de prazo | Advocacia, Construção | Compliance | 2 |
| Catálogo de produtos | Varejo, E-commerce | Vendas diretas | 2 |
| Cardápio digital | Alimentação | Self-service | 2 |
| Chatbot/IA | Todos | Auto-atendimento | 3 |

**Arquitetura:** `WhatsAppProvider` interface com adapters (MetaCloudApi, EvolutionApi, Twilio, Zenvia). Serviços de negócio: AppointmentReminder, PaymentReminder, OrderNotification, DocumentDelivery, SurveyRequest, DeadlineAlert.

**Arquivo:** `research_whatsapp_business_api.md`

---

## Contadores como Canal de Distribuição

### Por que Contadores são o Canal #1
- ~120K escritórios no Brasil, 80% atendem MPEs
- Média: 30-80 empresas por escritório
- 70-80% das MPEs seguem recomendação do contador
- **CAC via contador: R$ 0-50** (vs R$ 150-400 via Google Ads)
- **Churn via contador: 5-10%/ano** (vs 20-30%/ano via ads)

### Programa BusinessOS Contador

| Componente | Detalhe |
|---|---|
| **Portal do Contador** | Dashboard multi-cliente, exportação SPED, alertas fiscais, relatórios |
| **Revenue share** | 20% da mensalidade (vs 10-15% dos concorrentes) |
| **Certificação** | "Contador BusinessOS" — badge + treinamento |
| **Preço** | Free para contador (monetiza via clientes) |

### Concorrência no Canal
| Concorrente | Revenue Share | Força | Fraqueza |
|---|---|---|---|
| ContaAzul | 15-20% | 1º mover | Closed, caro |
| Omie | 10-15% | Programa completo | Closed, UX complexo |
| Nibo | Free → upsell | Free | Funcionalidades limitadas |

**Diferencial BusinessOS:** Open source, portal free, revenue share 20%, módulos verticais, API aberta.

**Arquivo:** `research_contadores_canal.md`

---

## UX e Onboarding — Benchmark por Nicho

### Padrões Observados

| Padrão | Exemplo | Tempo | Qualidade |
|---|---|---|---|
| **Wizard 3-5 etapas** | ContaAzul, Omie, Nibo | 1-5 min | Boa-Excelente |
| **Perfil pré-configurado** | iClinic, Sponte, Fresha | 3-8 min | Excelente |
| **Tour interativo** | HubSpot, PipeRun | 5-10 min | Boa |
| **Assisted onboarding** | TOTVS, SAP B1 | 1-8 semanas | Baixa (MPEs) |

### Onboarding Proposto — BusinessOS

**Fluxo universal (5 etapas):**
1. Cadastro (email/Google)
2. CNPJ → Auto-fill (BrasilAPI)
3. "Que tipo de negócio?" → Seleciona NICHO → pré-configura módulos
4. 2-3 perguntas específicas do nicho
5. Primeiro passo guiado → Aha moment!

### Aha Moment por Nicho

| Nicho | Primeira Ação | Tempo Alvo |
|---|---|---|
| Varejo | Emitir primeira NF-e | 5 min |
| E-commerce | Publicar vitrine 3 produtos | 10 min |
| Serviços | Criar primeira cobrança PIX | 2 min |
| Alimentação | Registrar primeira mesa | 3 min |
| Construção | Cadastrar primeira obra | 5 min |
| Saúde | Agendar primeira consulta | 3 min |
| Educação | Cadastrar primeira turma | 5 min |
| Prof. Liberais | Emitir primeira NFS-e | 3 min |

**Melhor referência:** Nibo (MEI em 30s) — BusinessOS deve igualar para Prof. Liberais.

**Arquivo:** `research_ux_onboarding.md`

---

## Concorrentes de Subnichos (23 analisados)

### Padrão Universal Descoberto

**Todo software de subnicho é forte na vertical e inexistente na horizontal.** Nenhum dos 23 softwares analisados possui: NF-e integrada, SPED, folha de pagamento, e-Social, CRM/captação, contabilidade, certificado digital, ou LGPD compliance.

### Top Concorrentes por Subnicho

| Subnicho | #1 | Preço | Força | Gap Explorável |
|---|---|---|---|---|
| Odontologia | Dental Office | R$ 249-499 | Odontograma FDI | Fiscal/SPED/RH |
| Estética | Fresha | Free | UX agendamento | Fiscal/SPED/RH |
| Advocacia | Domínio Sistemas | R$ 250-900 | Prazos + processos | Fiscal/CRM/captação |
| Psicologia | ZenPsi | R$ 99-199 | Prontuário CBT | Fiscal/SPED/RH |
| Veterinária | Vetor | R$ 199-499 | Clínica+petshop | Fiscal/SPED/RH |
| Academias | Gym Manager | R$ 149-349 | Mensalidade recorrente | Fiscal/SPED/RH |
| Oficinas | OficinaNet | R$ 149-349 | OS + histórico veículo | Fiscal/SPED/RH |
| Cursinhos | QMágica | R$ 300-1000 | Simulados + ranking | Fiscal/SPED/RH |
| Idiomas | Txell | R$ 197-497 | Matrícula por módulo | Fiscal/SPED/RH |

### Decisão Build por Subnicho

| Subnicho | Complexidade Vertical | Decisão | Fase |
|---|---|---|---|
| **Estética** | Média | BUILD | 1 |
| **Advocacia** | Média | BUILD | 1 |
| **Psicologia** | Baixa | BUILD | 1 |
| Odontologia | Alta | BUILD | 2 |
| Academias | Média | BUILD | 2 |
| Oficinas | Média | BUILD | 2 |
| Veterinária | Alta | BUILD | 3 |
| Cursinhos | Alta | BUILD | 3 |
| Idiomas | Média | BUILD | 3 |

**Arquivo:** `research_concorrentes_subnichos.md`

---

## Dores Transversais por Nicho — Síntese Consolidada

### Dores Universais (presentes em TODOS os 8 nichos)

| Dor | Prevalência | Impacto | Quem resolve hoje |
|---|---|---|---|
| **Inadimplência sem cobrança automatizada** | 100% | 20-40% de perda | Nenhum SaaS integrado |
| **NF-e/NFS-e complexa e por município** | 100% | Multa + atraso | Contador (manual) |
| **SPED/obrigações acessórias** | 100% | Multa se atrasar | Contador (manual) |
| **Fluxo de caixa no Excel ou inexistente** | 70%+ | Decisão no escuro | Nenhum |
| **Conciliação bancária manual** | 80%+ | Erro + perda de tempo | Nenhum |
| **Falta de dashboard gerencial** | 90%+ | Dono não sabe saúde do negócio | Nenhum |
| **Dependência do contador para tudo** | 80%+ | Sem autonomia | Contador (manual) |
| **WhatsApp como canal de negócio sem sistema** | 90%+ | Fragmentação | Parcial (Evolution API) |

### Dores #1 por Nicho (a dor mais urgente de cada setor)

| Nicho | Dor #1 | Impacto Financeiro | Solução BusinessOS |
|---|---|---|---|
| **Varejo** | Estoque impreciso (5-15% perda) | R$ 2-10K/mês | Inventário rotativo + curva ABC |
| **E-commerce** | Estoque sincronizado multicanal | Overselling = cliente irritado | Estoque unificado omnicanal |
| **Serviços** | Inadimplência em recorrência (20-35%) | R$ 3-15K/mês | Cobrança automática PIX/boleto |
| **Alimentação** | Desperdício de insumos (15-30%) | 5-10% do faturamento | Ficha técnica + estoque por validade |
| **Construção** | Orçamento vs realidade (+20-40%) | R$ 10-100K/obra | Custo-orçamento em tempo real |
| **Saúde** | No-show de pacientes (15-30%) | R$ 2-8K/mês | Lembrete WhatsApp + cobrança |
| **Educação** | Inadimplência (25-40%) | R$ 5-30K/mês | Cobrança + negociação automatizada |
| **Prof. Liberais** | Agendamento/cobrança manual | 20-40% perda de receita | Agendamento + recorrência PIX |

### Dores por Categoria

**OPERACIONAIS (processo):**
- Agendamento caótico (Saúde, Serviços, Estética, PL)
- Estoque impreciso (Varejo, E-commerce, Alimentação, Construção)
- Comunicação fragmentada (Todos — WhatsApp + e-mail + papel)
- Multi-plataforma / multi-painel (E-commerce, Alimentação)
- Documentos em papel (Saúde, Construção, Advocacia)

**FISCAIS/COMPLIANCE (obrigação):**
- NFS-e por município (Todos de serviços)
- NF-e/NFC-e instável (Varejo, Alimentação)
- SPED como pesadelo (Todos)
- e-Social complexo (Todos com funcionários)
- Registro de conselho obrigatório (Saúde, PL, Construção)

**FINANCEIRAS (sobrevivência):**
- Inadimplência crônica (Todos — 20-40%)
- Fluxo de caixa imprevisível (Todos)
- Conciliação bancária impossível (Todos)
- Margem desconhecida (Varejo, Alimentação, Serviços)
- Receita irregular/variável (PL, Serviços)

**DE GESTÃO (crescimento):**
- Dono/profissional não é gestor (Saúde, Educação, PL, Construção)
- Sem CRM/captação (Todos)
- Sem dashboard consolidado (Todos multi-loja/obra)
- Fidelização inexistente (Varejo, Alimentação, Saúde, Estética)
- Turnover alto (Alimentação, Varejo, Saúde)

---

## Próximos Passos de Pesquisa

- [x] Aprofundar subnichos (odontologia, veterinária, estética, psicologia, advocacia, etc.)
- [x] Pesquisar ERPs open source internacionais (Odoo, ERPNext, Dolibarr, Tryton, iDempiere)
- [x] Mapear APIs públicas disponíveis (ReceitaWS, BrasilAPI, IBGE, BACEN, SEFAZ, e-Social)
- [x] Pesquisar precificação dos concorrentes (tier, per-user, per-aluno, etc.)
- [x] Pesquisar integrações de pagamento (Mercado Pago, PagSeguro, Stone, Cielo, Asaas)
- [x] Mapear ecossistema de contadores como canal de distribuição
- [x] Pesquisar concorrentes de subnichos específicos (Dental Office, Domínio, Fresha, etc.)
- [x] Investigar compliance por conselho de classe (CRM, OAB, CREA, CAU)
- [x] Pesquisar WhatsApp Business API e integrações de comunicação
- [x] Benchmark de UX/onboarding por nicho (como Sponte, iClinic fazem onboarding)
- [ ] Validar hipóteses com usuários potenciais de cada nicho
- [ ] Mapear parcerias estratégicas (SEBRAE, Fecomércio, associações de nicho)
- [ ] Pesquisar LGPD compliance técnico para dados de saúde/sensíveis
- [ ] Pesquisar engine de workflow/automação (n8n, Temporal, BullMQ)
- [ ] Pesquisar certificado digital ICP-Brasil (integração, APIs, custos)
- [ ] Mapear SDKs/lib de NF-e, NFS-e, SPED open source para Node.js

---

## Índice de Arquivos de Pesquisa

| Arquivo | Nicho/Tema | Tamanho | Data |
|---|---|---|---|
| `research_varejo.md` | Varejo | 1.8 KB | 22/05 |
| `research_ecommerce.md` | E-commerce | 2.7 KB | 22/05 |
| `research_servicos.md` | Serviços | 3.2 KB | 22/05 |
| `research_alimentacao.md` | Alimentação | 3.2 KB | 22/05 |
| `research_construcao.md` | Construção | 4.2 KB | 22/05 |
| `research_saude.md` | Saúde | 11.1 KB | 22/05 |
| `research_educacao.md` | Educação | 11.9 KB | 22/05 |
| `research_profissionais_liberais.md` | Prof. Liberais | 11.7 KB | 22/05 |
| `research_erps_opensource.md` | ERPs Open Source | 13.5 KB | 23/05 |
| `research_apis_publicas.md` | APIs Públicas BR | 10.6 KB | 23/05 |
| `research_integracoes_pagamento.md` | Gateways Pagamento | 11.4 KB | 23/05 |
| `research_subnichos.md` | Subnichos (10) | 12.1 KB | 23/05 |
| `research_precificacao.md` | Precificação | 8.9 KB | 23/05 |
| `research_compliance_conselhos.md` | Compliance Conselhos (7) | 14.2 KB | 23/05 |
| `research_whatsapp_business_api.md` | WhatsApp Business API | 10.5 KB | 23/05 |
| `research_contadores_canal.md` | Contadores como Canal | 9.7 KB | 23/05 |
| `research_ux_onboarding.md` | UX/Onboarding Benchmark | 11.0 KB | 23/05 |
| `research_concorrentes_subnichos.md` | Concorrentes Subnichos (23) | 13.6 KB | 23/05 |

**Total:** 18 arquivos | ~155 KB de pesquisa

---

*Atualizado em: 23/05/2026 v3 — 8 nichos + 10 subnichos + 23 concorrentes subnicho + 7 conselhos + ERPs OS + APIs + pagamentos + WhatsApp + contadores canal + UX onboarding consolidados | Próximo ciclo: LGPD técnico, workflow engine, certificado digital, SDKs NF-e/SPED Node.js*
