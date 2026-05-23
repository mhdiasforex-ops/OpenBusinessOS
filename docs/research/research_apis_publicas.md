# APIs Públicas Brasileiras — Mapeamento para Integração com o BusinessOS

**Versão:** 1.0  
**Data:** 23/05/2026  
**Fontes:** Documentação oficial, BrasilAPI, ReceitaWS, devs.gov.br

---

## Visão Geral

Mapeamento de APIs públicas brasileiras disponíveis para integração com o BusinessOS. Objetivo: automatizar validação de dados, enriquecimento de cadastros, compliance fiscal e conformidade regulatória.

---

## 1. Receita Federal — Consulta CNPJ

**URL:** https://receitaws.com.br/api/v1/cnpj/{cnpj}  
**Dados:** Razão social, nome fantasia, CNAE, situação cadastral, endereço, QSA (quadro societário), capital social  
**Autenticação:** Free (1 req/min) ou token pago  
**Limites:** 1 req/min (free), 3 req/min (basic R$29,90/mês), ilimitado (pro R$99,90/mês)  
**Status:** Ativa e estável  
**Utilidade BusinessOS:** 
- Validação automática de CNPJ no cadastro de empresas/fornecedores
- Autopreenchimento de dados (razão social, endereço, CNAE)
- Verificação de situação ativa/suspensa/negativada

---

## 2. BrasilAPI — CEP

**URL:** https://brasilapi.com.br/api/cep/v1/{cep}  
**Dados:** Logradouro, bairro, cidade, UF, complemento  
**Autenticação:** Nenhuma (open)  
**Limites:** Rate limit flexível (uso consciente)  
**Status:** Ativa, mantida pela comunidade  
**Utilidade BusinessOS:**
- Autopreenchimento de endereços em cadastros (clientes, fornecedores, filiais)
- Validação de CEP em formulários
- Eliminação de erros de digitação

---

## 3. BrasilAPI — CNPJ

**URL:** https://brasilapi.com.br/api/cnpj/v1/{cnpj}  
**Dados:** Mesmos dados da ReceitaWS mas via API unificada  
**Autenticação:** Nenhuma  
**Limites:** Rate limit flexível  
**Status:** Ativa  
**Utilidade BusinessOS:** Alternativa à ReceitaWS sem custo — melhor para MPEs

---

## 4. BrasilAPI — DDD

**URL:** https://brasilapi.com.br/api/ddd/v1/{ddd}  
**Dados:** Lista de cidades por DDD  
**Autenticação:** Nenhuma  
**Status:** Ativa  
**Utilidade BusinessOS:** Validação de telefones, auto-preenchimento de estado por DDD

---

## 5. BrasilAPI — Banco

**URL:** https://brasilapi.com.br/api/banks/v1/{code}  
**Dados:** Nome do banco, CNPJ, isbp  
**Autenticação:** Nenhuma  
**Status:** Ativa  
**Utilidade BusinessOS:** Validação de código bancário em cadastros de contas bancárias

---

## 6. BrasilAPI — NCM (Nomenclatura Comum do Mercosul)

**URL:** https://brasilapi.com.br/api/ncm/v1  
**Dados:** Código NCM, descrição, capítulo  
**Autenticação:** Nenhuma  
**Status:** Ativa  
**Utilidade BusinessOS:** Classificação fiscal de produtos — essencial para NF-e

---

## 7. BrasilAPI — CFIPI

**URL:** https://brasilapi.com.br/api/cfip/v1  
**Dados:** Códigos CFOP com descrições  
**Autenticação:** Nenhuma  
**Status:** Ativa  
**Utilidade BusinessOS:** CFOPs para emissão de NF-e/NFS-e — automação de classificação fiscal

---

## 8. CNES — Cadastro Nacional de Estabelecimentos de Saúde

**URL:** https://cnes.datasus.gov.br/  
**API:** Download de dados (CSV) em http://cnes2.datasus.gov.br/  
**Dados:** Nome do estabelecimento, CNES, CNPJ, CEP, tipo (hospital, clínica, consultório), prestador SUS, leitos, especialidades  
**Autenticação:** Nenhuma (dados públicos)  
**Limites:** Download em lote (não é API REST)  
**Status:** Ativo (DATASUS)  
**Utilidade BusinessOS:**
- Validação de estabelecimentos de saúde no módulo Saúde
- Importação de dados de clínicas/hospitais
- Vinculação CNES ↔ CNPJ para cadastro completo

---

## 9. MEC/INEP — Censo Escolar e Cadastro de Instituições

**URL:** https://inep.gov.br/microdados  
**API:** Download de microdados (CSV) — não há API REST oficial  
**Dados:** Nome da escola, INEP, CNPJ, endereço, dependência administrativa (privada/pública), etapa de ensino, matrículas, infraestrutura  
**Autenticação:** Nenhuma (dados públicos)  
**Limites:** Arquivos anuais, atualização anual  
**Status:** Ativo  
**Utilidade BusinessOS:**
- Validação de escolas particulares no módulo Educação
- Importação de dados para cadastro de escolas
- Cruzamento INEP ↔ CNPJ

---

## 10. OAB — Cadastro de Advogados

**URL:** https://cna.oab.org.br/  
**API:** Não há API pública. Consulta web manual por nome/OAB.  
**Dados:** Nome, número OAB, seccional, situação (ativo/inativo)  
**Autenticação:** Necessária (login)  
**Limites:** Consulta manual, scraping possível mas legalmente questionável  
**Status:** Ativo (web)  
**Utilidade BusinessOS:**
- Validação de advogados no módulo Profissionais Liberais
- Verificação de situação ativa para exercício da profissão
- **Restrição:** sem API, precisa de parceria ou input manual

---

## 11. CREA/CAU — Profissionais de Engenharia e Arquitetura

**URL CREA:** https://www.confea.org.br/consulta-publica  
**URL CAU:** https://cau.org.br/servicos/consulta-publica/  
**API:** Não há API pública. Consulta web manual.  
**Dados:** Nome, número registro, situação, especialidade  
**Autenticação:** Necessária (web)  
**Limites:** Manual  
**Status:** Ativo (web)  
**Utilidade BusinessOS:**
- Validação de engenheiros/arquitetos no módulo Construção
- Verificação de registro ativo para ART/RRT
- **Restrição:** sem API, input manual

---

## 12. Correios — Busca de CEP

**URL:** https://viacep.com.br/ws/{cep}/json/  
**Dados:** Logradouro, complemento, bairro, localidade, UF, IBGE  
**Autenticação:** Nenhuma  
**Limites:** Sem limite oficial (uso consciente)  
**Status:** Ativa (ViaCEP = proxy não-oficial dos Correios)  
**Utilidade BusinessOS:**
- Alternativa à BrasilAPI para CEP (fallback)
- Código IBGE do município — essencial para SPED/EFD

---

## 13. BACEN — Câmbio e Taxas

**URL:** https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/  
**Dados:** Cotação de moedas (USD, EUR, etc.), taxas Selic, câmbio PTAX  
**Autenticação:** Nenhuma (OData público)  
**Limites:** Sem limite  
**Status:** Ativa  
**Utilidade BusinessOS:**
- Câmbio para MPEs que importam/exportam (Comércio Exterior)
- Taxa Selic para cálculos financeiros (juros, multas)
- Conversão de moeda no módulo Financeiro

---

## 14. ReceitaWS — Consulta CNPJ (Alternativa)

**URL:** https://www.receitaws.com.br/v1/cnpj/{cnpj}  
**Dados:** Idem item 1 (mesma fonte, diferente wrapper)  
**Autenticação:** Free limitado ou token  
**Status:** Ativa  
**Utilidade BusinessOS:** Fallback para BrasilAPI CNPJ

---

## 15. IBGE — Classificação e Geografia

**URL:** https://servicodados.ibge.gov.br/api/v1/  
**Dados:** Municípios, estados, regiões, classificações (CNAE, NCM), nomes, localidades  
**Autenticação:** Nenhuma  
**Limites:** Sem limite  
**Status:** Ativa  
**Utilidade BusinessOS:**
- Código IBGE do município (obrigatório em NF-e, SPED)
- Classificação CNAE para cadastro de empresas
- Nomes de localidades para formulários

---

## 16. SEFAZ — Consulta de NF-e

**URL (Nacional):** https://www.nfe.fazenda.gov.br/portal/consulta.aspx  
**API:** Webservice SOAP (CadastraContribuinte, ConsultaCadastro, NfeConsultaNF)  
**Dados:** Status da NF-e, cadastro de contribuintes, confirmação de destinatário  
**Autenticação:** Certificado digital A1/A3  
**Limites:** Por UF, requer certificado  
**Status:** Ativa  
**Utilidade BusinessOS:**
- **Core do módulo Fiscal** — emissão e consulta de NF-e
- Validação de destinatário antes de emitir
- Consulta de cadastro de contribuinte ICMS

---

## 17. e-Social — Eventos Trabalhistas

**URL:** https://www.esocial.gov.br/  
**API:** Webservice SOAP (envioLoteEventos, consultaLoteEventos)  
**Dados:** Eventos S-1200 (remuneração), S-1210 (pagamentos), S-2190 (admissão), S-2299 (desligamento), S-5001/S-5011 (tributos)  
**Autenticação:** Certificado digital + procuração eletrônica  
**Limites:** Por evento, lote de até 50 eventos  
**Status:** Ativa  
**Utilidade BusinessOS:**
- **Core do módulo RH** — envio de eventos trabalhistas
- Cálculo de tributos sobre folha (INSS, FGTS, IRRF)
- Compliance obrigatório para MPEs com funcionários

---

## 18. SPED — EFD ICMS/IPI e ECD/ECF

**URL:** Não há API. Programas validadores em https://sped.rfb.gov.br/  
**Dados:** Layouts de arquivos texto (EFD, ECD, ECF, REINF)  
**Autenticação:** Nenhuma (documentação pública)  
**Limites:** N/A (geração de arquivo)  
**Status:** Ativo  
**Utilidade BusinessOS:**
- **Core do módulo Fiscal** — geração de arquivos SPED
- EFD ICMS/IPI para MPEs do regime normal
- ECD/ECF para contabilidade completa
- EFD-Reinf para retenções na fonte

---

## 19. Open PNCP — Portal de Compras Públicas

**URL:** https://pncp.gov.br/api/  
**Dados:** Licitações, contratos, órgãos públicos, atas de registro de preços  
**Autenticação:** Nenhuma (consulta pública)  
**Limites:** Rate limit padrão  
**Status:** Ativa  
**Utilidade BusinessOS:**
- Potencial módulo de vendas para MPEs que vendem para governo
- Monitoramento de licitações relevantes
- Integração com módulo CRM (oportunidades governamentais)

---

## 20. DataSUS — Saúde Pública

**URL:** https://datasus.saude.gov.br/  
**API:** FTP/HTTP download (TABNET, TABWIN)  
**Dados:** SIA (ambulatorial), SIH (hospitalar), SINAN (agravo), CNES (estabelecimentos)  
**Autenticação:** Nenhuma (dados públicos)  
**Limites:** Download em lote  
**Status:** Ativo  
**Utilidade BusinessOS:**
- Dados epidemiológicos para clínicas
- Vinculação com CNES
- Potencial para dashboards de saúde pública

---

## Resumo — Priorização de Integração

### Crítico (Fase 1)
| API | Uso | Complexidade |
|---|---|---|
| BrasilAPI CEP | Autopreenchimento endereço | Baixa |
| BrasilAPI/ReceitaWS CNPJ | Validação/autofill cadastro | Baixa |
| IBGE Municípios | Código IBGE para NF-e/SPED | Baixa |
| BACEN PTAX | Câmbio e taxas | Baixa |

### Importante (Fase 2)
| API | Uso | Complexidade |
|---|---|---|
| SEFAZ Webservice | Emissão/consulta NF-e | Alta (certificado) |
| e-Social Webservice | Eventos trabalhistas RH | Alta (certificado) |
| SPED (geração) | EFD ICMS/IPI, ECD/ECF | Alta (layout complexo) |
| BrasilAPI NCM/CFOP | Classificação fiscal | Média |

### Futuro (Fase 3+)
| API | Uso | Complexidade |
|---|---|---|
| CNES | Validação estabelecimentos saúde | Média |
| MEC/INEP | Validação escolas | Média |
| Open PNCP | Licitações públicas | Média |
| DataSUS | Dados saúde pública | Média |
| OAB/CREA/CAU | Validação profissionais | Alta (sem API) |

---

*Pesquisa concluída em: 23/05/2026*
