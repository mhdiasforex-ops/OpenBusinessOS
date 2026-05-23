# ERPs Open Source Internacionais — Referência de Arquitetura para o BusinessOS

**Versão:** 1.0  
**Data:** 23/05/2026  
**Fontes:** Sites oficiais, GitHub, documentação técnica, G2/Capterra

---

## Visão Geral

Pesquisa de ERPs open source internacionais como referência arquitetural e funcional para o BusinessOS. O objetivo é entender padrões de modularização, licenciamento, comunidade e stack para informar decisões de arquitetura.

---

## 1. Odoo

**Site:** https://www.odoo.com  
**Licença:** LGPLv3 (community) + Odoo Enterprise License (proprietary)  
**Stack:** Python (framework custom), PostgreSQL, JavaScript (OWL framework), XML/QWeb templates  
**Comunidade:** ~50K+ contribuidores GitHub, 7M+ usuários, 30K+ apps no marketplace  
**Modelo:** Open core — versão community free, versão enterprise paga

### O que FAZ
- **30+ módulos oficiais:** CRM, Vendas, Compras, Inventário, Contabilidade, RH, Folha, Projetos, Helpdesk, E-commerce, Ponto de Venda, Marketing, Manufatura, PLM, Qualidade, Manutenção, Frota, Documentos, Assinaturas, Despesas, Apptivo
- **Marketplace de 30K+ apps:** comunidade cria módulos para tudo (localizações fiscais, integrações, verticais de nicho)
- **Modularidade total:** instala só o que precisa, cada módulo é independente
- **Multi-tenant:** suporta múltiplas empresas no mesmo banco
- **API REST + RPC (XML/JSON):** integração externa robusta
- **Workflow engine:** automações configuráveis por módulo
- **Relatórios:** QWeb templates + PDF, BI básico
- **Mobile:** app nativo iOS/Android
- **Localização fiscal:** comunidade mantém módulos para 50+ países (Brasil incluso, mas fraco)

### O que NÃO FAZ (para MPEs brasileiras)
- Localização fiscal BR é fraca/incompleta (NF-e, SPED, e-Social não são nativos)
- Módulos BR dependem de terceiros (OCA/l10n-brazil) — instáveis
- Curva de aprendizado alta para customização Python
- Enterprise tem custo por usuário (não é realmente free para produção)
- Suporte oficial é pago e caro
- ORM custom (não Django/Flask) — ecossistema menor que alternatives Python

### Arquitetura
- **Monolito modular:** tudo em um processo Python, mas módulos são plugins
- **Banco único PostgreSQL:** todas as tabelas em um schema
- **Mecanismo de módulos:** cada módulo é um diretório com `__manifest__.py`, models, views, security, data
- **Herança de modelos:** extends sem modificar código original (prototyped inheritance)
- **View engine:** XML declarativo → QWeb rendering
- **Event system:** signals/bus para comunicação inter-módulo

### Lições para o BusinessOS
- **Open core funciona:** community atrai developers, enterprise monetiza
- **Marketplace é o motor de crescimento:** 30K+ apps > qualquer equipe interna
- **Modularidade via plugins:** cada módulo com manifest, dependências declarativas
- **Herança de modelos:** poderoso para verticais de nicho sem fork
- **Fricção:** ORM custom = curva de aprendizado. BusinessOS deve usar stack padrão (NestJS/Prisma)

---

## 2. ERPNext

**Site:** https://erpnext.com  
**Licença:** GPLv3 (core) + Frappe Public License (apps marketplace)  
**Stack:** Python (Frappe Framework), MariaDB, Redis, Node.js (build), Vue.js/Svelte (frontend)  
**Comunidade:** ~3K+ contribuidores, 1M+ downloads, forte presença na Índia/África  
**Modelo:** 100% open source + hosting gerenciado (Frappe Cloud)

### O que FAZ
- **Módulos nativos:** Contabilidade, Vendas, Compras, Estoque, RH, Folha, CRM, Projetos, Manufatura, E-commerce, Helpdesk, Educação (escolar), Saúde (hospitalar), Agronegócio, Sem fins lucrativos
- **Verticais de nicho built-in:** ERPNext tem módulos de Educação, Saúde e NGO nativos — raro entre ERPs
- **Desk/UI customizável:** cada usuário configura seu workspace
- **Workflow engine:** aprovações, estados, regras configuráveis
- **Print formats:** Jinja templates para notas fiscais, recibos
- **API RESTful:** completa, com OAuth2
- **Multi-empresa/moeda:** nativo
- **Frappe Cloud:** hosting gerenciado com deploy 1-click

### O que NÃO FAZ (para MPEs brasileiras)
- Sem localização fiscal BR nativa (comunidade india/áfrica, não Brasil)
- MariaDB (não PostgreSQL) — limita extensibilidade
- Stack Frappe é própria — poucos devs conhecem vs NestJS/Next.js
- Interface é pesada/lenta comparado a SPA moderno
- Comunidade menor que Odoo
- Sem marketplace robusto (apps existem mas poucos)

### Arquitetura
- **Frappe Framework:** meta-framework — define modelos em JSON, gera CRUD automático
- **DocType system:** cada entidade = JSON schema + Python controller + JS view
- **Apps como plugins:** cada "app" é um diretório com DocTypes, pages, reports
- **MariaDB + Redis:** persistência + cache
- **Background jobs:** RQ (Redis Queue) para tarefas assíncronas
- **Event hooks:** sistema de hooks declarativos para estender comportamento

### Lições para o BusinessOS
- **Meta-framework é poderoso:** DocType system gera 80% do CRUD automaticamente
- **Verticais built-in:** educação e saúde nativos = referência direta para BusinessOS
- **JSON schema para modelos:** similar ao Prisma schema, mas com geração automática de UI
- **Hook system:** extensível sem modificar código original — bom padrão
- **Fricção:** stack própria (Frappe) limita contribuidores. NestJS/Prisma = muito mais familiar

---

## 3. Dolibarr

**Site:** https://www.dolibarr.org  
**Licença:** GPLv3+  
**Stack:** PHP, MySQL/MariaDB/PostgreSQL, JavaScript (jQuery)  
**Comunidade:** ~500 contribuidores, 200K+ instalações, forte na França/Europa  
**Modelo:** 100% open source, sem versão enterprise

### O que FAZ
- **Módulos:** CRM, Vendas, Compras, Estoque, Contabilidade básica, RH, Projetos, Agendamentos, Point of Sale, E-commerce (externo), Documentos, Banca/Agência, Fundações
- **Ativação por módulo:** admin liga/desliga cada módulo
- **Multi-empresa/moeda/idioma:** nativo
- **API REST:** disponível (com Swagger)
- **PDF generation:** templates customizáveis
- **Instalador simples:** LAMP stack, 5 minutos
- **Perfis pré-definidos:** configuração rápida por tipo de negócio

### O que NÃO FAZ
- Sem verticais de nicho (saúde, educação, construção)
- UI desatualizada (jQuery, não SPA)
- Contabilidade é básica — não serve para compliance fiscal BR
- Sem marketplace de extensões
- Comunidade pequena vs Odoo/ERPNext
- Sem folha de pagamento nativa
- Arquitetura monolítica antiga — difícil de estender

### Arquitetura
- **PHP procedural + OOP híbrido:** código legado com classes
- **Módulos como diretórios:** cada módulo tem seu dir com classes, templates, SQL
- **Hooks system:** pontos de extensão declarados no core
- **Banco relacional simples:** tabelas por módulo, chaves estrangeiras mínimas
- **Triggers:** before/after insert/update/delete para lógica de negócio

### Lições para o BusinessOS
- **Ativação por módulo é essencial:** MPEs só ligam o que precisam
- **Perfis pré-definidos:** referência direta para onboarding por nicho do BusinessOS
- **Simplicidade de instalação:** LAMP = 5 min deploy. Docker = equivalente moderno
- **Fricção:** PHP legado = dead end. Stack moderna (NestJS) é melhor investimento
- **Sem verticais:** é o gap que o BusinessOS preenche

---

## 4. Tryton

**Site:** https://www.tryton.org  
**Licença:** GPLv3+  
**Stack:** Python (Tryton framework), PostgreSQL, GTK (desktop) + Sao (web)  
**Comunidade:** ~200 contribuidores, forte na Espanha/Europa, ~5K instalações  
**Modelo:** 100% open source, sem versão enterprise

### O que FAZ
- **Módulos oficiais:** Contabilidade, Vendas, Compras, Estoque, Produção, Projetos, Analítica, Account Statement, Party (contatos), Carriers, Currency
- **Arquitetura modular exemplar:** cada módulo é independente, dependências declarativas
- **Multi-empresa/contabilidade:** muito robusto (influenciado por OpenERP/Odoo v5)
- **PostgreSQL-only:** aproveita features avançadas do PG
- **API XML-RPC/JSON-RPC:** integração externa
- **Translation framework:** i18n completo

### O que NÃO FAZ
- Sem verticais de nicho
- Sem CRM/funil de vendas nativo
- Sem E-commerce
- Sem RH/folha
- UI web (Sao) é limitada — cliente principal é GTK desktop
- Comunidade muito pequena
- Sem marketplace

### Arquitetura
- **Framework Tryton:** ORM próprio sobre PostgreSQL
- **Módulos Python:** cada módulo = package Python com `tryton.cfg`
- **Ir.model / Ir.ui.form:** meta-modelos para extensibilidade
- **PostgreSQL avançado:** usa CTEs, window functions, savepoints
- **Cliente-servidor:** arquitetura thick-client (GTK) + thin-client (Sao)

### Lições para o BusinessOS
- **Modularidade rigorosa:** Tryton é o melhor exemplo de módulos independentes
- **PostgreSQL como alavanca:** usar features avançadas do PG (Prisma permite)
- **Declaração de dependências entre módulos:** essencial para resolver ativação
- **Fricção:** GTK desktop = ultrapassado. SPA web é obrigação

---

## 5. iDempiere

**Site:** https://www.idempiere.org  
**Licença:** GPLv2+  
**Stack:** Java (OSGi/Eclipse RAP), PostgreSQL, Web UI  
**Comunidade:** ~100 contribuidores, forte na América Latina/África, ~10K instalações  
**Modelo:** 100% open source, fork do ADempiere

### O que FAZ
- **Módulos:** Contabilidade, Vendas, Compras, Estoque, Produção, RH, CRM, Projetos, Web POS, Web Store
- **OSGi plugin system:** módulos como bundles OSGi — hot deploy
- **Application Dictionary:** meta-dados configuráveis (campos, janelas, relatórios) sem código
- **Multi-organização/tenant:** nativo
- **Workflow engine:** baseado em XPDL
- **Web UI (Eclipse RAP):** moderno comparado a Dolibarr/Tryton
- **Multi-idioma/moeda:** completo

### O que NÃO FAZ
- Stack Java/OSGi = pesado, curva de aprendizado alta
- Sem verticais de nicho
- Comunidade muito pequena
- UI é funcional mas não bonita
- Sem marketplace de apps
- Instalação complexa (OSGi, equinox, etc.)

### Arquitetura
- **OSGi (Equinox):** módulos como bundles com lifecycle gerenciado
- **Application Dictionary:** dicionário de dados central — adiciona campos sem codificar
- **Model Validator:** hooks para lógica de negócio antes/depois de operações
- **Callout:** regras de UI dinâmicas (similar a computed properties)
- **PostgreSQL:** banco principal
- **Process/Report:** classes Java para processos batch e relatórios

### Lições para o BusinessOS
- **Application Dictionary:** meta-dados configuráveis sem código = poderoso para MPEs
- **OSGi modularidade:** referência de plugin system (mas Node.js/NestJS é mais simples)
- **Model Validator:** padrão de hooks antes/depois = middleware pattern
- **Fricção:** Java/OSGi = overengineering. NestJS modules = equivalente mais simples

---

## Comparativo Arquitetural

| Aspecto | Odoo | ERPNext | Dolibarr | Tryton | iDempiere | BusinessOS |
|---|---|---|---|---|---|---|
| **Linguagem** | Python | Python | PHP | Python | Java | TypeScript |
| **Framework** | Custom ORM | Frappe | Nenhum | Tryton ORM | OSGi/AD | NestJS + Prisma |
| **Banco** | PostgreSQL | MariaDB | MySQL/PG | PostgreSQL | PostgreSQL | PostgreSQL |
| **Frontend** | OWL/JS | Vue/Svelte | jQuery | GTK/Sao | Eclipse RAP | Next.js/React |
| **Licença** | LGPLv3+EE | GPLv3 | GPLv3 | GPLv3 | GPLv2 | MIT/Apache |
| **Modularidade** | Excelente | Boa | Básica | Excelente | Excelente (OSGi) | Planejada |
| **Marketplace** | 30K+ apps | Poucos apps | Nenhum | Nenhum | Nenhum | Planejado |
| **Verticais nicho** | Via apps | Saúde/Edu built-in | Nenhuma | Nenhuma | Nenhuma | 8 nichos BR |
| **Localização BR** | Fraca (OCA) | Inexistente | Inexistente | Inexistente | Parcial (LATAM) | Nativa |
| **Comunidade** | 50K+ | 3K+ | 500 | 200 | 100 | Iniciando |
| **UI moderna** | Sim | Média | Não | Não | Média | Sim |

---

## Síntese: O que o BusinessOS Deve Copiar e O que Deve Evitar

### COPAR (Padrões Validados)
1. **Modularidade via plugins com manifest** (Odoo) — cada módulo declara dependências, ativa/desativa
2. **Marketplace de extensões** (Odoo) — motor de crescimento, comunidade contribui
3. **Verticais de nicho built-in** (ERPNext) — saúde e educação nativos, não como afterthought
4. **Ativação por perfil/nicho** (Dolibarr) — onboarding por tipo de negócio
5. **Meta-dados configuráveis** (iDempiere AD) — campos custom sem código
6. **Hook/middleware system** (todos) — extensibilidade sem modificar core
7. **PostgreSQL como banco único** (Odoo, Tryton, iDempiere) — features avançadas

### EVITAR (Anti-padrões)
1. **ORM/framework custom** (Odoo, ERPNext, Tryton) — curva de aprendizado, poucos devs
2. **Stack proprietária** (Frappe, GTK, OSGi) — limita comunidade
3. **Monolito sem limites** (Dolibarr) — difícil de escalar
4. **Desktop-first UI** (Tryton GTK) — web/mobile-first é obrigação
5. **Licença copyleft restrictiva** (GPL) — inibe parcerias comerciais. MIT/Apache = melhor

### DIFERENCIAL DO BUSINESSOS
1. **Stack moderna e popular:** NestJS/Prisma/Next.js = maior pool de devs brasileiros
2. **Localização fiscal BR nativa:** NF-e, NFC-e, NFS-e, SPED, e-Social no core
3. **Verticais de nicho para MPEs brasileiras:** 8 nichos mapeados, templates de onboarding
4. **Open source permissivo:** MIT/Apache atrai contribuidores e parceiros
5. **API-first + Event-driven:** NestJS modules + Prisma = modularidade + extensibilidade

---

*Pesquisa concluída em: 23/05/2026*
