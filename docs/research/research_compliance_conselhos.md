# Compliance por Conselho de Classe — Pesquisa para o BusinessOS

**Versão:** 1.0  
**Data:** 23/05/2026  
**Fontes:** Sites oficiais dos conselhos, resoluções publicadas, CFM, OAB, CREA, CAU, CRM, CFO, CRO

---

## Visão Geral

Mapeamento das obrigações de conformidade regulatória por conselho de classe profissional no Brasil. O BusinessOS precisa atender estas exigências nos módulos verticais por subnicho para ser viável como sistema de gestão completo.

---

## 1. CRM — Conselho Regional de Medicina

**Regulado por:** CFM (Conselho Federal de Medicina)  
**Base legal:** Lei 3.268/1957, Resoluções CFM  
**Sites:** https://cfm.org.br | https://portal.cfm.org.br

### Obrigações do Profissional
- Registro ativo no CRM do estado de exercício
- Responsabilidade técnica por estabelecimento (RT)
- Prontuário médico conforme Resolução CFM 1.631/2003
- Prescrição com número CRM + assinatura
- Preenchimento de Declaração de Óbito (DO) quando necessário
- Notificação compulsória de doenças (ANVISA)
- Conformidade com LGPD para dados de saúde (Resolução CFM 2.314/2022)

### Obrigações do Estabelecimento (Clínica/Hospital)
- Alvará sanitário vigente (VISA)
- Responsável Técnico (médico com CRM ativo)
- Registro no CNES (Cadastro Nacional de Estabelecimentos de Saúde)
- Programa de Controle de Infecção Hospitalar (PCIH) — se hospitalar
- Vigilância em Saúde (ANVISA/VISA)
- Contraste/radiologia: licença CNEN específica

### Obrigações Digitais/Eletrônicas
- **Prontuário Eletrônico (PEP):** Resolução CFM 2.023/2013 — requisitos de segurança, assinatura digital, auditoria, backup
- **Receita Eletrônica:** Resolução CFM 2.311/2022 — receita médica digital com assinatura ICP-Brasil
- **Telemedicina:** Resolução CFM 2.314/2022 — permitida com restrições (não substitui presencial para 1a consulta em alguns casos)
- **LGPD para saúde:** Resolução CFM 2.314/2022 — dados de saúde são dados sensíveis, consentimento obrigatório, registro de operações

### Impacto no BusinessOS — Módulo Saúde
| Funcionalidade | Obrigatório | Prioridade |
|---|---|---|
| Prontuário eletrônico com assinatura digital | Sim | Crítica |
| Log de auditoria (quem acessou, quando) | Sim | Crítica |
| Backup automático com criptografia | Sim | Crítica |
| Receita eletrônica (PDF assinado ICP-Brasil) | Sim | Alta |
| Controle de consentimento LGPD | Sim | Alta |
| Validação CRM ativo (sem API — manual) | Desejável | Média |
| Notificação compulsória (ANVISA) | Desejável | Média |
| Telemedicina (videochamada + prontuário) | Opcional | Baixa |

---

## 2. CFO — Conselho Federal de Odontologia

**Regulado por:** CFO  
**Base legal:** Lei 4.324/1964, Resoluções CFO  
**Site:** https://cfo.org.br

### Obrigações do Profissional
- Registro ativo no CRO (Conselho Regional de Odontologia) do estado
- Responsabilidade Técnica por estabelecimento
- Prontuário odontológico conforme Resolução CFO 192/2018
- Prescrição com número CRO + assinatura
- Radiografias com proteção radiológica (CNEN)

### Obrigações do Estabelecimento
- Alvará sanitário (VISA)
- RT odontólogo com CRO ativo
- Registro no CNES
- Licença CNEN para equipamentos de raio-X
- Controle de infecção (protocolo ANVISA)

### Obrigações Digitais
- **Prontuário Odontológico Eletrônico:** Resolução CFO 192/2018 — odontograma, histórico, evolução, assinatura digital
- **Odontograma digital:** obrigatório (formato FDI — Federação Dentária Internacional)
- **Radiografia digital:** integração DICOM
- **LGPD:** dados de saúde sensíveis, mesmo regime do CFM

### Impacto no BusinessOS — Módulo Odontologia
| Funcionalidade | Obrigatório | Prioridade |
|---|---|---|
| Odontograma digital (formato FDI) | Sim | Crítica |
| Prontuário odontológico eletrônico | Sim | Crítica |
| Assinatura digital em prontuário | Sim | Crítica |
| Log de auditoria | Sim | Crítica |
| Controle de insumos (ANVISA — rastreabilidade lote/validade) | Sim | Alta |
| Radiografia DICOM integration | Desejável | Média |
| Validação CRO ativo | Desejável | Média |

---

## 3. OAB — Ordem dos Advogados do Brasil

**Regulado por:** OAB  
**Base legal:** Lei 8.906/1994 (Estatuto da OAB), Regulamento Geral, Código de Ética  
**Site:** https://www.oab.org.br

### Obrigações do Profissional
- Registro ativo na OAB (seccional do estado)
- Inscrição principal + suplementar (se atua em outro estado)
- Sigilo profissional (art. 7º, II — Estatuto)
- Prazos processuais (CPP e CPC)
- Prestação de contas ao cliente (art. 34, XXI)
- Escrituração do livro de caixa (art. 34, XX)

### Obrigações do Escritório
- Registro no Cadastro Nacional de Escritórios de Advocacia (CNEA)
- Contrato de prestação de serviços (escrito, com honorários)
- Nota fiscal de serviços (NFS-e) por serviço/honorário
- Conformidade com LGPD — dados de clientes são sensíveis (sigilo)
- Segregação de valores do cliente (saldo de custas, honorários de êxito)

### Obrigações Digitais
- **Processo Eletrônico:** 100% dos tribunais usam sistema eletrônico (PJe, e-SAJ, PROJUDI, VIRTUS)
- **Petição Eletrônica:** envio via sistema do tribunal — não há API direta (cada tribunal tem seu sistema)
- **Certificado Digital OAB:** e-CPF ICP-Brasil para assinatura de petições
- **Prazos eletrônicos:** intimações digitais com ciência em até 10 dias (CPC art. 183)
- **Livro Caixa Eletrônico:** obrigatório (art. 34, XX) — pode ser digital

### Impacto no BusinessOS — Módulo Advocacia
| Funcionalidade | Obrigatório | Prioridade |
|---|---|---|
| Controle de prazos processuais com alerta | Sim | Crítica |
| Time tracking por caso/cliente | Sim | Alta |
| Livro caixa eletrônico | Sim | Alta |
| Gestão de honorários (fixo, êxito, hora) | Sim | Alta |
| NFS-e por honorário | Sim | Alta |
| Portal do cliente (status do processo) | Desejável | Média |
| Integração com sistemas de tribunais | Desejável | Baixa (sem API) |
| Validação OAB ativa | Desejável | Média |
| Criptografia de dados (sigilo) | Sim | Crítica |

---

## 4. CREA — Conselho Regional de Engenharia e Agronomia

**Regulado por:** CONFEA (Conselho Federal)  
**Base legal:** Lei 5.194/1966, Lei 6.496/1977 (ART)  
**Site:** https://www.confea.org.br

### Obrigações do Profissional
- Registro ativo no CREA do estado
- Anotação de Responsabilidade Técnica (ART) para cada obra/serviço
- ART de obra (construção), ART de serviço (projeto, laudo), ART de cargo/função
- Visto em ART de outro estado (se atua fora)
- Atestado de capacidade técnica (para licitações)

### Obrigações da Empresa (Construtora/Projetista)
- Registro no CREA-Q (Quadro de Pessoal) — empresa precisa ter RT com CREA
- ART por obra/projeto — obrigatória, penalidades por ausência
- Alvará de construção (prefeitura)
- Licença ambiental (IBAMA/EMA quando aplicável)
- NRs (Normas Regulamentadoras) — NR-18 (obra), NR-6 (EPI), NR-35 (altura)
- Seguro de Responsabilidade Civil (não obrigatório mas recomendado)

### Obrigações Digitais
- **ART Eletrônica:** 100% digital via sistema do CREA (cada estado tem seu portal)
- **Certificado Digital:** e-CPF ICP-Brasil para assinatura de ART e projetos
- **Projeto Eletrônico:** plantas em DWG/PDF com assinatura digital do RT
- **Habitese Eletrônico:** some municípios já emitem digitalmente

### Impacto no BusinessOS — Módulo Construção
| Funcionalidade | Obrigatório | Prioridade |
|---|---|---|
| Gestão de ARTs (emissão, controle, vencimento) | Sim | Crítica |
| Cadastro de RT (CREA ativo) | Sim | Crítica |
| Controle de NRs (EPI, treinamentos, PCMAT) | Sim | Alta |
| Alvará e licenças com alerta de vencimento | Sim | Alta |
| NFS-e por projeto/serviço | Sim | Alta |
| Certificado digital para assinatura | Desejável | Média |
| Integração portal CREA (ART eletrônica) | Desejável | Baixa (sem API) |

---

## 5. CAU — Conselho de Arquitetura e Urbanismo

**Regulado por:** CAU/BR (Conselho Federal)  
**Base legal:** Lei 12.378/2010  
**Site:** https://www.caubr.gov.br

### Obrigações do Profissional
- Registro ativo no CAU do estado
- RRT (Registro de Responsabilidade Técnica) — equivalente à ART para arquitetos
- RRT por projeto/obra
- Atestado de capacidade técnica

### Obrigações da Empresa
- Registro no CAU (pessoa jurídica)
- RT arquiteto com CAU ativo
- RRT por projeto
- Conformidade com Código de Obras municipal
- Licença de construção (alvará)

### Obrigações Digitais
- **RRT Eletrônico:** via portal CAU/BR
- **Certificado Digital:** para assinatura de projetos
- **Projeto Eletrônico:** mesmas regras do CREA

### Impacto no BusinessOS — Módulo Construção
| Funcionalidade | Obrigatório | Prioridade |
|---|---|---|
| Gestão de RRTs (emissão, controle) | Sim | Crítica |
| Cadastro de RT (CAU ativo) | Sim | Crítica |
| Controle de alvarás e licenças | Sim | Alta |
| Mesmas funcionalidades do módulo CREA | — | — |

**NOTA:** CREA e CAU podem ser unificados no mesmo módulo Construção — ART para engenheiros, RRT para arquitetos.

---

## 6. CRC — Conselho Regional de Contabilidade

**Regulado por:** CFC (Conselho Federal)  
**Base legal:** Lei 9.295/1946, Decreto 9.590/2018  
**Site:** https://cfc.org.br

### Obrigações do Profissional
- Registro ativo no CRC do estado
- Certificação técnica (exame de suficiência — obrigatório desde 2015)
- NBC (Normas Brasileiras de Contabilidade) — conformidade
- Educação continuada (mínimo de horas/ano)

### Obrigações da Empresa (Escritório de Contabilidade)
- Registro no CRC (pessoa jurídica)
- Responsabilidade Técnica sobre clientes
- ECD, ECF, SPED — escrituração em conformidade
- Guarda de documentos por 5+ anos
- Conformidade com NBC TG (Trabalhos de Garantia)

### Obrigações Digitais
- **SPED:** 100% digital — ECD, ECF, EFD-ICMS, EFD-PIS/COFINS, EFD-Reinf, e-Social
- **ReceitaNet:** transmissão via programa da RFB
- **Certificado Digital:** e-CNPJ e e-CPF para transmissão
- **DCTFWeb:** declaração de tributos federais

### Impacto no BusinessOS — Contador como Canal
| Funcionalidade | Obrigatório | Prioridade |
|---|---|---|
| Exportação de dados para SPED | Sim | Crítica |
| Geração de ECD/ECF | Desejável | Média |
| Integração com contador (export/import) | Sim | Crítica |
| Dashboard para contador ver clientes | Sim | Alta |
| Conformidade NBC TG | Desejável | Média |

---

## 7. CRECI — Conselho Regional de Corretores de Imóveis

**Regulado por:** COFECI (Conselho Federal)  
**Base legal:** Lei 6.530/1978  
**Site:** https://www.cofeci.gov.br

### Obrigações do Profissional
- Registro ativo no CRECI
- Responsabilidade sobre transações imobiliárias
- Recibos e contratos com numeração

### Obrigações da Empresa (Imobiliária)
- Registro no CRECI (PJ)
- Contrato de intermediação com cliente
- Recibos de sinal, comissão, aluguel
- Fiador/garantia locatícia

### Impacto no BusinessOS — Potencial Módulo Imobiliário
- Gestão de contratos de locação/venda
- Controle de comissões
- Recibos com numeração sequencial

---

## Síntese — Tabela de Conformidade por Conselho

| Conselho | Profissão | Registro Obrigatório | Doc Técnico | Prazo/Carencia | Digital | API Disponível |
|---|---|---|---|---|---|---|
| **CRM** | Médico | CRM | PEP, Receita | — | PEP, Telemedicina | Não |
| **CFO** | Odontólogo | CRO | PEP Odonto, Odontograma | — | PEP, DICOM | Não |
| **OAB** | Advogado | OAB | Livro Caixa, Petição | Prazos processuais | PJe, e-SAJ | Não (por tribunal) |
| **CREA** | Engenheiro | CREA | ART | — | ART eletrônica | Não |
| **CAU** | Arquiteto | CAU | RRT | — | RRT eletrônico | Não |
| **CRC** | Contador | CRC | SPED, ECD/ECF | Calendário fiscal | SPED 100% | SPED webservice |
| **CRECI** | Corretor imóveis | CRECI | Contratos, Recibos | — | Parcial | Não |

---

## Padrões Comuns a Todos os Conselhos

1. **Registro ativo é obrigatório** — profissional e empresa precisam de registro vigente
2. **Responsabilidade Técnica (RT)** — todo estabelecimento precisa de um profissional responsável
3. **Documento técnico por obra/serviço** — ART, RRT, petição, prontuário — cada ato profissional gera documento
4. **Sigilo/Confidencialidade** — dados do cliente são protegidos por ética profissional + LGPD
5. **Certificado Digital ICP-Brasil** — necessário para assinatura de documentos eletrônicos
6. **NENHUM conselho tem API pública** — validação de registro é manual via site
7. **Migração para digital é avançada** — ART, RRT, PEP, SPED, PJe são todos eletrônicos

---

## Recomendação Arquitetural para o BusinessOS

### Módulo de Compliance Centralizado

Criar um **módulo de Compliance** no core do BusinessOS que:

1. **Cadastro de Conselhos** — tabela com conselho, estado, obrigações, documentos
2. **Validação de Registro** — campo obrigatório no cadastro de profissionais + alerta de vencimento (manual, sem API)
3. **Gestão de Documentos Técnicos** — ART, RRT, prontuário, petição — cada tipo com template e workflow
4. **Assinatura Digital** — integração com ICP-Brasil (certificado A1/A3)
5. **Alertas de Prazo** — vencimento de registro, alvará, licença, prazos processuais
6. **Auditoria/LGPD** — log de acessos, consentimento, direitos do titular
7. **Templates por Conselho** — cada conselho tem templates de documentos obrigatórios

### Implementação por Subnicho

| Subnicho | Conselho | Documentos Obrigatórios | Complexidade |
|---|---|---|---|
| Clínicas médicas | CRM | PEP + Receita + Consentimento | Alta |
| Odontologia | CFO | PEP Odonto + Odontograma + Rastreabilidade | Alta |
| Advocacia | OAB | Livro Caixa + Prazos + Petição + Honorários | Média |
| Construção (eng.) | CREA | ART + NRs + Alvará | Média |
| Construção (arq.) | CAU | RRT + Alvará | Média |
| Contabilidade (canal) | CRC | SPED + ECD/ECF + NBC | Alta (canal, não usuário) |

---

*Pesquisa concluída em: 23/05/2026*
