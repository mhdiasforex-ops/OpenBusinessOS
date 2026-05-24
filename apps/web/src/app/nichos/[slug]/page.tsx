'use client';


import Link from 'next/link';
import { useParams } from 'next/navigation';

const niches: Record<string, {
  icon: string; name: string; title: string; tagline: string;
  pains: { title: string; desc: string }[];
  features: { title: string; desc: string }[];
  comparison: { feature: string; generic: string; businessos: string }[];
  cta: string;
}> = {
  varejo: {
    icon: '🛒', name: 'Varejo',
    title: 'O ERP que <strong>entende de varejo</strong> — PDV, NFC-e, estoque e muito mais',
    tagline: 'Do pequeno comércio à rede multi-loja. Tudo que você precisa para vender mais e gerir melhor.',
    pains: [
      { title: 'PDV desconectado do estoque', desc: 'Sistema de frente de caixa que não atualiza o estoque em tempo real. Produto vendeu mas o sistema ainda mostra disponível.' },
      { title: 'NFC-e complexa e lenta', desc: 'Emitir nota fiscal do consumidor exige equipamento caro, certificado digital e integração que nunca funciona de primeira.' },
      { title: 'Gestão de múltiplas lojas', desc: 'Cada loja com seu sistema, seu estoque, seu financeiro. Consolidar tudo vira um trabalho manual interminável.' },
    ],
    features: [
      { title: 'PDV Completo', desc: 'Venda rápida, recebimento em múltiplas formas (dinheiro, cartão, PIX), sangria, reforço e fechamento de caixa integrados.' },
      { title: 'NFC-e Nativa', desc: 'Emissão direta sem plugins. Suporte a SAT, ECF e NFC-e. Certificado digital integrado.' },
      { title: 'Estoque em Tempo Real', desc: 'Cada venda baixa o estoque automaticamente. Alerta de estoque mínimo e sugestão de compra.' },
      { title: 'Multi-loja Nativo', desc: 'Uma plataforma, várias lojas. Estoque segregado ou compartilhado. Relatórios consolidados.' },
      { title: 'Financeiro Completo', desc: 'Contas a pagar/receber, fluxo de caixa, DRE, conciliação bancária e SPED fiscal.' },
      { title: 'CRM + WhatsApp', desc: 'Cadastro de clientes, histórico de compras, recuperação de vendas e cobrança via WhatsApp.' },
    ],
    comparison: [
      { feature: 'PDV + NFC-e', generic: 'Sistemas separados', businessos: 'Integrado nativamente' },
      { feature: 'Estoque em tempo real', generic: 'Atualização manual', businessos: 'Automático via PDV' },
      { feature: 'Multi-loja', generic: 'Plano separado por loja', businessos: 'Incluso' },
      { feature: 'CRM integrado', generic: 'Não tem', businessos: 'Incluso' },
      { feature: 'WhatsApp', generic: 'Não tem', businessos: 'Integrado' },
      { feature: 'Fiscal (SPED)', generic: 'Sistema extra', businessos: 'Nativo' },
      { feature: 'Open Source', generic: 'Código fechado', businessos: '100% aberto (MIT)' },
    ],
    cta: 'Vender mais com BusinessOS',
  },
  ecommerce: {
    icon: '🌐', name: 'E-commerce',
    title: 'O ERP que <strong>potencializa seu e-commerce</strong> — vitrine, marketplaces e gestão unificada',
    tagline: 'Venda em múltiplos canais sem complicação. Estoque, pedidos e financeiro tudo em um só lugar.',
    pains: [
      { title: 'Estoque descentralizado', desc: 'Vende na loja própria, no Mercado Livre e no Shopee. Cada canal com estoque separado. Vende o mesmo produto duas vezes sem saber.' },
      { title: 'Integração de marketplaces', desc: 'Conectar cada marketplace exige integração diferente, técnica e caríssima. O custo de manutenção come seu lucro.' },
      { title: 'NF-e para cada canal', desc: 'Cada canal de venda exige emissão de NF-e com regras diferentes. O processo manual toma horas do seu dia.' },
    ],
    features: [
      { title: 'Gestão de Estoque Unificada', desc: 'Estoque centralizado que sincroniza em tempo real com todos os canais de venda. Sempre atualizado.' },
      { title: 'Marketplace Integrado', desc: 'Conecte Mercado Livre, Shopee, Amazon e outros em poucos cliques. Pedidos sincronizados automaticamente.' },
      { title: 'NF-e Automática', desc: 'Emissão de NF-e no momento da aprovação do pedido. Regras fiscais por estado e regime tributário.' },
      { title: 'Gestão de Pedidos', desc: 'Todos os pedidos de todos os canais em uma única fila. Separação, embalagem e envio organizados.' },
      { title: 'Financeiro Integrado', desc: 'Recebimentos por canal, conciliação automática, cálculo de comissões e taxas por marketplace.' },
      { title: 'CRM + Recuperação de Carrinho', desc: 'Dispare emails e WhatsApp para recuperar carrinhos abandonados. Aumente sua taxa de conversão.' },
    ],
    comparison: [
      { feature: 'Marketplaces', generic: 'Integração paga', businessos: 'Incluso' },
      { feature: 'Estoque unificado', generic: 'Manual entre canais', businessos: 'Automático' },
      { feature: 'NF-e por canal', generic: 'Plugins separados', businessos: 'Nativo' },
      { feature: 'CRM + Recuperação', generic: 'Não tem', businessos: 'Incluso' },
      { feature: 'Gestão de Pedidos', generic: 'Fragmentada', businessos: 'Unificada' },
      { feature: 'Open Source', generic: 'Código fechado', businessos: '100% aberto (MIT)' },
    ],
    cta: 'Vender online com BusinessOS',
  },
  servicos: {
    icon: '💼', name: 'Serviços',
    title: 'O ERP que <strong>entende de serviços</strong> — contratos, NFS-e, recorrência e CRM',
    tagline: 'Prestação de serviços descomplicada. Do orçamento à nota fiscal, tudo no mesmo fluxo.',
    pains: [
      { title: 'NFS-e trabalhosa', desc: 'Cada cidade tem uma regra de NFS-e diferente. Emitir nota fiscal de serviços é um pesadelo burocrático.' },
      { title: 'Contratos espalhados', desc: 'Contratos de prestação de serviços em PDF avulso, sem gestão de renovação, reajuste ou vigência.' },
      { title: 'Recorrência manual', desc: 'Clientes recorrentes exigem emissão de nota e cobrança todo mês. O processo manual é ineficiente e propenso a erros.' },
    ],
    features: [
      { title: 'NFS-e Multi-cidade', desc: 'Cadastre as regras de cada município e emita NFS-e corretamente para cada cliente, onde quer que ele esteja.' },
      { title: 'Gestão de Contratos', desc: 'Crie, gerencie e acompanhe contratos de prestação de serviços. Renovação automática e reajuste programado.' },
      { title: 'Assinaturas e Recorrência', desc: 'Configure planos recorrentes. A cobrança e a NFS-e são emitidas automaticamente todo mês.' },
      { title: 'CRM de Serviços', desc: 'Histórico completo do cliente, chamados abertos, contratos vigentes e tickets pendentes.' },
      { title: 'Orçamento a Proposta', desc: 'Crie orçamentos profissionais, converta em proposta, acompanhe a aprovação e vire contrato.' },
      { title: 'Timesheet', desc: 'Registro de horas por projeto/cliente. Aprovação e faturamento baseado em horas apontadas.' },
    ],
    comparison: [
      { feature: 'NFS-e', generic: 'Sistema separado por cidade', businessos: 'Multi-cidade nativo' },
      { feature: 'Gestão de Contratos', generic: 'Pastas e planilhas', businessos: 'Integrada ao financeiro' },
      { feature: 'Recorrência', generic: 'Manual todo mês', businessos: 'Automática' },
      { feature: 'CRM', generic: 'Separado do fiscal', businessos: 'Integrado' },
      { feature: 'Timesheet', generic: 'Não tem', businessos: 'Incluso' },
      { feature: 'Open Source', generic: 'Código fechado', businessos: '100% aberto (MIT)' },
    ],
    cta: 'Prestar serviços com BusinessOS',
  },
  alimentacao: {
    icon: '🍽️', name: 'Alimentação',
    title: 'O ERP que <strong>entende de alimentação</strong> — cardápio, delivery, delivery e NFC-e',
    tagline: 'Restaurantes, bares e padarias. Gestão simplificada do cardápio ao fechamento do caixa.',
    pains: [
      { title: 'Cardápio desatualizado', desc: 'Mudou o preço do prato? Precisa alterar no sistema, no iFood, no cardápio impresso. Três lugares diferentes.' },
      { title: 'Delivery desconectado', desc: 'Os pedidos do iFood e WhatsApp chegam, mas não entram no sistema. Alguém precisa digitar tudo de novo.' },
      { title: 'Fechamento de caixa demorado', desc: 'Conferir vendas em dinheiro, cartão, PIX e vale-refeição no fim do dia é um processo manual que toma horas.' },
    ],
    features: [
      { title: 'Cardápio Digital', desc: 'Cardápio único que atualiza em todos os canais: PDV, delivery próprio e agregadores.' },
      { title: 'Delivery Integrado', desc: 'iFood, WhatsApp e delivery próprio integrados. Pedidos caem direto na cozinha.' },
      { title: 'Comanda e Mesa', desc: 'Abertura de mesa, transferência de comanda, fechamento dividido por pessoa ou por item.' },
      { title: 'NFC-e + SAT', desc: 'Emissão de NFC-e e SAT integrada ao fechamento da conta. Impressão automática.' },
      { title: 'Gestão de Insumos', desc: 'Receitas com custo por ingrediente. Sugestão de compra baseada no movimento.' },
      { title: 'Financeiro Completo', desc: 'Contas a pagar/receber, fluxo de caixa, DRE, conciliação de vendas por forma de pagamento.' },
    ],
    comparison: [
      { feature: 'Cardápio', generic: 'Separado por canal', businessos: 'Unificado' },
      { feature: 'Delivery', generic: 'Não integrado', businessos: 'Integrado' },
      { feature: 'NFC-e', generic: 'Sistema extra', businessos: 'Nativo' },
      { feature: 'Gestão de Mesas', generic: 'Sistema separado', businessos: 'Incluso' },
      { feature: 'Custo por Receita', generic: 'Planilha manual', businessos: 'Automático' },
      { feature: 'Open Source', generic: 'Código fechado', businessos: '100% aberto (MIT)' },
    ],
    cta: 'Gerir seu restaurante com BusinessOS',
  },
  construcao: {
    icon: '🏗️', name: 'Construção Civil',
    title: 'O ERP que <strong>entende de construção</strong> — orçamentos, obras, medição e ART',
    tagline: 'Da obra ao financeiro. Controle de custos, prazos e documentos técnicos integrados.',
    pains: [
      { title: 'Orçamento impreciso', desc: 'Orçar uma obra envolve dezenas de itens entre materiais, mão de obra e equipamentos. Um erro no orçamento pode custar caro.' },
      { title: 'Medição e faturamento', desc: 'Acompanhar o avanço físico da obra e faturar corretamente cada etapa é um processo que consome tempo precioso.' },
      { title: 'ART e documentos', desc: 'Emissão de ART, alvarás e documentos técnicos exige sistemas especializados e integração com CREA.' },
    ],
    features: [
      { title: 'Orçamentação de Obras', desc: 'Orçamento detalhado por etapa, com composição de custos, BDI e margem por item.' },
      { title: 'Medição por Etapa', desc: 'Acompanhamento físico-financeiro da obra. Faturamento automático por etapa concluída.' },
      { title: 'ART Integrada', desc: 'Conexão com CREA para emissão de ART. Controle de responsabilidade técnica por obra.' },
      { title: 'Gestão de Fornecedores', desc: 'Cadastro, cotação, pedidos e recebimento de materiais. Comparação de preços automaticamente.' },
      { title: 'CRF e CCT', desc: 'Controle de Recebimento Financeiro (CRF) e Cronograma de Custos (CCT) integrados ao financeiro.' },
      { title: 'Financeiro da Obra', desc: 'Fluxo de caixa por obra. Acompanhamento de custos reais vs orçados. Margem por empreendimento.' },
    ],
    comparison: [
      { feature: 'Orçamentação', generic: 'Planilha ou sistema extra', businessos: 'Nativo' },
      { feature: 'Medição', generic: 'Manual', businessos: 'Integrada ao financeiro' },
      { feature: 'ART/CREA', generic: 'Sistema separado', businessos: 'Integrado' },
      { feature: 'CRF/CCT', generic: 'Não tem', businessos: 'Incluso' },
      { feature: 'Fornecedores', generic: 'Sistema separado', businessos: 'Integrado' },
      { feature: 'Open Source', generic: 'Código fechado', businessos: '100% aberto (MIT)' },
    ],
    cta: 'Construir com BusinessOS',
  },
  saude: {
    icon: '🏥', name: 'Saúde',
    title: 'O ERP que <strong>entende de saúde</strong> — agenda, prontuário, TISS e convênios',
    tagline: 'Clínicas, consultórios e profissionais de saúde. Gestão completa com prontuário eletrônico.',
    pains: [
      { title: 'Prontuário caro e complexo', desc: 'Sistemas de prontuário eletrônico custam caro e exigem integração separada com o financeiro e fiscal.' },
      { title: 'Agenda perdida', desc: 'Pacientes marcam por WhatsApp, telefone e presencialmente. A agenda nunca reflete a realidade.' },
      { title: 'TISS e convênios', desc: 'Troca de informações com operadoras de plano de saúde exige padrão TISS. Burocrático e técnico.' },
    ],
    features: [
      { title: 'Prontuário Eletrônico', desc: 'Prontuário completo com evolução, anamnese, exames, receitas e atestados. Assinatura digital.' },
      { title: 'Agenda Inteligente', desc: 'Agenda online com confirmação automática via WhatsApp. Lembrete de consulta redução de faltas.' },
      { title: 'TISS Nativo', desc: 'Troca de informações no padrão TISS. Guias de consulta, procedimentos e faturas de convênios.' },
      { title: 'Gestão de Convênios', desc: 'Cadastro de convênios, tabela de procedimentos, glosas e faturamento por operadora.' },
      { title: 'LGPD Saúde', desc: 'Gestão de consentimento, política de privacidade e termos específicos para dados de saúde.' },
      { title: 'Financeiro da Clínica', desc: 'Contas a pagar/receber, fluxo de caixa, DRE, conciliação de recebimentos de convênios.' },
    ],
    comparison: [
      { feature: 'Prontuário', generic: 'Sistema extra caro', businessos: 'Incluso' },
      { feature: 'Agenda', generic: 'Desconectada do WhatsApp', businessos: 'Integrada' },
      { feature: 'TISS', generic: 'Sistema separado', businessos: 'Nativo' },
      { feature: 'LGPD', generic: 'Não tem', businessos: 'Incluso' },
      { feature: 'Convênios', generic: 'Manual', businessos: 'Integrado' },
      { feature: 'Open Source', generic: 'Código fechado', businessos: '100% aberto (MIT)' },
    ],
    cta: 'Cuidar com BusinessOS',
  },
  educacao: {
    icon: '📚', name: 'Educação',
    title: 'O ERP que <strong>entende de educação</strong> — matrículas, diário, mensalidades e inadimplência',
    tagline: 'Escolas, cursos e plataformas de ensino. Gestão acadêmica e financeira integradas.',
    pains: [
      { title: 'Matrícula descentralizada', desc: 'Alunos se matriculam presencialmente, pelo site e por WhatsApp. Cada canal alimenta um sistema diferente.' },
      { title: 'Mensalidades e inadimplência', desc: 'Controlar mensalidades, bolsas, descontos e inadimplência de dezenas de alunos é um trabalho manual enorme.' },
      { title: 'Diário de classe', desc: 'Registro de presença e notas em diário físico ou sistema separado que não conversa com o financeiro.' },
    ],
    features: [
      { title: 'Matrícula Digital', desc: 'Pré-matrícula online, rematrícula automática, documentação digital e contrato de prestação de serviços.' },
      { title: 'Gestão de Mensalidades', desc: 'Boletos, PIX e carnês. Bolsas, descontos e reajustes automáticos. Controle de inadimplência.' },
      { title: 'Diário de Classe', desc: 'Registro de presença, notas, atividades e conteúdo programático. Liberação automática de boletim.' },
      { title: 'Comunicação com Pais', desc: 'Disparo de comunicados, boletins e alertas de falta via WhatsApp e email.' },
      { title: 'Portal do Aluno', desc: 'Consulta de notas, frequência, mensalidades e solicitação de documentos pelo portal.' },
      { title: 'Financeiro Educacional', desc: 'Contas a pagar/receber, fluxo de caixa, DRE, conciliação bancária e SPED.' },
    ],
    comparison: [
      { feature: 'Matrícula', generic: 'Presencial + sistema', businessos: 'Digital integrada' },
      { feature: 'Mensalidades', generic: 'Planilha manual', businessos: 'Automático' },
      { feature: 'Diário de Classe', generic: 'Sistema separado', businessos: 'Incluso' },
      { feature: 'Comunicação', generic: 'Não tem', businessos: 'WhatsApp + Email' },
      { feature: 'Portal do Aluno', generic: 'Sistema extra', businessos: 'Incluso' },
      { feature: 'Open Source', generic: 'Código fechado', businessos: '100% aberto (MIT)' },
    ],
    cta: 'Ensinar com BusinessOS',
  },
  profissionais: {
    icon: '⚖️', name: 'Profissionais Liberais',
    title: 'O ERP que <strong>entende de profissionais liberais</strong> — NFS-e, compliance e CRM',
    tagline: 'Advogados, médicos, engenheiros, contadores. Gestão profissional com compliance dos conselhos.',
    pains: [
      { title: 'NFS-e + compliance', desc: 'Emitir NFS-e e manter registro profissional ativo no conselho (OAB, CREA, CRC) exige sistemas separados.' },
      { title: 'Controle de horas', desc: 'Advogados e consultores precisam registrar horas por cliente/projeto. Sem sistema adequado, horas deixam de ser faturadas.' },
      { title: 'CRM sem fiscal', desc: 'CRM separado do fiscal. O lead vira cliente, mas a emissão da nota e o contrato ficam em outro sistema.' },
    ],
    features: [
      { title: 'NFS-e + Fiscal', desc: 'Emissão de NFS-e completa. Regras por município, regime tributário e retenção de impostos.' },
      { title: 'Compliance com Conselhos', desc: 'Registro profissional, controle de validade de documentos, notificação de vencimento.' },
      { title: 'Timesheet', desc: 'Registro de horas por cliente/projeto. Aprovação e faturamento baseado em horas trabalhadas.' },
      { title: 'Contratos Inteligentes', desc: 'Contratos de honorários, prestação de serviços e parcerias. Renovação e reajuste automáticos.' },
      { title: 'CRM Profissional', desc: 'Funil de vendas, histórico de contatos, propostas e contratos integrados.' },
      { title: 'Financeiro Completo', desc: 'Contas a pagar/receber, fluxo de caixa, DRE, conciliação bancária e declaração de imposto de renda.' },
    ],
    comparison: [
      { feature: 'NFS-e', generic: 'Sistema separado', businessos: 'Nativo' },
      { feature: 'Compliance', generic: 'Planilha ou nada', businessos: 'Controle automático' },
      { feature: 'Timesheet', generic: 'Não tem', businessos: 'Incluso' },
      { feature: 'Contratos', generic: 'PDF avulso', businessos: 'Gestão integrada' },
      { feature: 'CRM', generic: 'Separado', businessos: 'Integrado ao fiscal' },
      { feature: 'Open Source', generic: 'Código fechado', businessos: '100% aberto (MIT)' },
    ],
    cta: 'Trabalhar com BusinessOS',
  },
};

const container: React.CSSProperties = { maxWidth: 1120, margin: '0 auto', padding: '0 24px' };
const sectionStyle: React.CSSProperties = { padding: '64px 0' };
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 };

export default function NichePage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? '';
  const niche = niches[slug];

  if (!niche) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>Nicho não encontrado</h1>
        <Link href="/" style={{ color: '#533afd', textDecoration: 'none' }}>Voltar para o início</Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fff', color: '#061b31', fontFamily: "'Source Sans 3',system-ui,sans-serif", lineHeight: 1.5 }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e5edf5' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, maxWidth: 1120, margin: '0 auto', padding: '0 24px' }}>
          <Link href="/" style={{ fontSize: 18, fontWeight: 700, color: '#061b31', textDecoration: 'none', letterSpacing: -0.5 }}>
            Business<span style={{ color: '#533afd' }}>OS</span>
          </Link>
          <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '8px 20px', borderRadius: 4, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none', background: '#533afd', color: '#fff', textDecoration: 'none' }}>
            Começar grátis
          </Link>
        </div>
      </nav>

      <section style={{ padding: '80px 0 64px', textAlign: 'center', background: 'linear-gradient(180deg,#fff 0%,#f6f9fc 100%)' }}>
        <div style={container}>
          <span style={{ fontSize: 56, marginBottom: 16, display: 'block' }}>{niche.icon}</span>
          <h1 style={{ fontSize: 44, fontWeight: 300, lineHeight: 1.12, letterSpacing: -1.2, maxWidth: 700, margin: '0 auto 16px' }}
            dangerouslySetInnerHTML={{ __html: niche.title }} />
          <p style={{ fontSize: 18, fontWeight: 300, color: '#64748b', maxWidth: 560, margin: '0 auto 32px', lineHeight: 1.5 }}>{niche.tagline}</p>
          <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '14px 32px', borderRadius: 6, fontSize: 16, fontWeight: 600, background: '#533afd', color: '#fff', textDecoration: 'none' }}>
            {niche.cta}
          </Link>
        </div>
      </section>

      <section style={{ ...sectionStyle, background: '#fff' }}>
        <div style={container}>
          <h2 style={{ fontSize: 32, fontWeight: 300, letterSpacing: -0.7, textAlign: 'center', marginBottom: 40 }}>
            Dores que <strong style={{ fontWeight: 700, color: '#533afd' }}>só quem é do nicho conhece</strong>
          </h2>
          <div style={gridStyle}>
            {niche.pains.map((pain, i) => (
              <div key={i} style={{ padding: 24, borderRadius: 6, background: '#f6f9fc', border: '1px solid #e5edf5' }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#ea2261', flexShrink: 0 }} />
                  {pain.title}
                </h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.5 }}>{pain.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ ...sectionStyle, background: '#1c1e54', color: '#fff' }}>
        <div style={container}>
          <h2 style={{ fontSize: 32, fontWeight: 300, letterSpacing: -0.7, textAlign: 'center', marginBottom: 40, color: '#fff' }}>
            Tudo que você precisa, <strong style={{ fontWeight: 700, color: '#b9b9f9' }}>num só lugar</strong>
          </h2>
          <div style={gridStyle}>
            {niche.features.map((feat, i) => (
              <div key={i} style={{ padding: 24, borderRadius: 6, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: '#fff' }}>{feat.title}</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,.65)', lineHeight: 1.5 }}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ ...sectionStyle, background: '#f6f9fc' }}>
        <div style={container}>
          <h2 style={{ fontSize: 32, fontWeight: 300, letterSpacing: -0.7, textAlign: 'center', marginBottom: 40 }}>
            BusinessOS vs <strong style={{ fontWeight: 700, color: '#533afd' }}>sistemas genéricos</strong>
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', maxWidth: 900, margin: '0 auto', borderCollapse: 'separate', borderSpacing: 0, border: '1px solid #e5edf5', borderRadius: 6, overflow: 'hidden', background: '#fff' }}>
              <thead>
                <tr>
                  <th style={{ background: '#061b31', color: '#fff', fontSize: 13, fontWeight: 600, padding: '12px 16px', textAlign: 'left' }}>Funcionalidade</th>
                  <th style={{ background: '#061b31', color: '#fff', fontSize: 13, fontWeight: 600, padding: '12px 16px', textAlign: 'left' }}>Sistema Genérico</th>
                  <th style={{ background: '#533afd', color: '#fff', fontSize: 13, fontWeight: 600, padding: '12px 16px', textAlign: 'left' }}>BusinessOS</th>
                </tr>
              </thead>
              <tbody>
                {niche.comparison.map((row, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: 14, padding: '12px 16px', borderBottom: '1px solid #e5edf5', fontWeight: 600, color: '#061b31' }}>{row.feature}</td>
                    <td style={{ fontSize: 14, padding: '12px 16px', borderBottom: '1px solid #e5edf5', color: '#ea2261', fontWeight: 500 }}>{row.generic}</td>
                    <td style={{ fontSize: 14, padding: '12px 16px', borderBottom: '1px solid #e5edf5', color: '#15be53', fontWeight: 500 }}>{row.businessos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section style={{ padding: '80px 0', background: '#1c1e54', textAlign: 'center', color: '#fff' }}>
        <div style={container}>
          <h2 style={{ fontSize: 36, fontWeight: 300, letterSpacing: -0.8, marginBottom: 16, color: '#fff' }}>
            Pronto para <strong style={{ fontWeight: 700, color: '#b9b9f9' }}>simplificar sua gestão?</strong>
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,.7)', maxWidth: 500, margin: '0 auto 32px', fontWeight: 300 }}>
            BusinessOS é gratuito, open source. Comece agora e ative apenas o que seu nicho precisa.
          </p>
          <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '14px 32px', borderRadius: 6, fontSize: 16, fontWeight: 600, background: '#533afd', color: '#fff', textDecoration: 'none', border: 'none' }}>
            {niche.cta}
          </Link>
        </div>
      </section>

      <footer style={{ padding: '48px 0', background: '#0a0e27', color: 'rgba(255,255,255,.5)', fontSize: 13, textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginBottom: 16 }}>
          <a href="#" style={{ color: 'rgba(255,255,255,.7)', textDecoration: 'none' }}>Documentação</a>
          <a href="#" style={{ color: 'rgba(255,255,255,.7)', textDecoration: 'none' }}>GitHub</a>
          <a href="#" style={{ color: 'rgba(255,255,255,.7)', textDecoration: 'none' }}>Comunidade</a>
          <a href="#" style={{ color: 'rgba(255,255,255,.7)', textDecoration: 'none' }}>Contato</a>
        </div>
        <p>&copy; 2026 BusinessOS. Licença MIT. Feito no Brasil para o Brasil.</p>
      </footer>
    </div>
  );
}
