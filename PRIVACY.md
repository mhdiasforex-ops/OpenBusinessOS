# Política de Privacidade — OpenBusinessOS

## 1. Responsável

O controlador dos dados é a organização que utiliza o OpenBusinessOS. O software é self-hosted e cada instância é responsável por seus próprios dados.

## 2. Dados Coletados

| Dado | Finalidade | Base Legal |
|------|-----------|------------|
| Nome, email, telefone do cliente | Gestão de relacionamento (CRM) | Execução de contrato |
| Documento (CPF/CNPJ) | Emissão de documentos fiscais | Obrigação legal |
| Dados financeiros (transações) | Gestão financeira e contábil | Execução de contrato |
| Dados de uso (analytics) | Melhoria do produto | Legítimo interesse |

## 3. Multi-Tenant

Os dados são isolados por organização (tenant). Nenhuma organização tem acesso aos dados de outra.

## 4. Direitos do Titular (Art. 18 LGPD)

- **Acesso**: `GET /crm/customers/:id`
- **Correção**: `PATCH /crm/customers/:id`
- **Exclusão**: `DELETE /crm/customers/:id`
- **Portabilidade**: `GET /analytics/metrics` + exportação CSV

## 5. Retenção

- Dados financeiros: 5 anos (obrigação fiscal)
- Dados de CRM: enquanto o contrato vigorar + 2 anos
- Logs de auditoria: 6 meses

## 6. Segurança

- Criptografia JWT para autenticação
- Isolamento de banco por organizationId
- Redis para sessões/eventos (sem persistência sensível)
- HTTPS obrigatório em produção

## 7. Consentimento

O onboarding registra o aceite dos termos de uso e política de privacidade por organização.

## 8. Contato

Para solicitações de direitos do titular, use a API ou entre em contato com o administrador da sua organização.

---

*Este documento é parte do OpenBusinessOS e deve ser adaptado conforme as necessidades específicas de cada organização.*
