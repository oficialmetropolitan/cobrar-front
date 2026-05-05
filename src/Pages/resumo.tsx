import React, { useEffect, useState } from 'react';
import {
  Users, Wallet, TrendingUp, AlertCircle,
  Calendar, BarChart3, Building2, Banknote,
  CheckCircle, Clock, XCircle, ArrowUpRight,
  CreditCard, PiggyBank, DollarSign, Activity,
} from 'lucide-react';
import { DashboardService } from '../api/api';

/* ─── helpers ──────────────────────────────────────────────────── */
const moeda = (v: number | null | undefined) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const fmtData = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');

/* ─── tipos ────────────────────────────────────────────────────── */
interface Resumo {
  carteira: {
    total_clientes: number;
    total_contratos: number;
    capital_total_emprestado: number;
    montante_total_recebido: number;
    receita_mensal_esperada: number;
    spread_total_carteira: number;
  };
  parcelas_por_status: { status: string; qtd: number; total_valor: number }[];
  inadimplencia: { clientes_inadimplentes: number; total_em_atraso: number };
  adiantamentos: {
    por_status: {
      status: string;
      quantidade: number;
      total_enviado: number;
      total_a_receber: number;
      total_spread: number;
    }[];
    totais: {
      quantidade: number;
      total_enviado: number;
      total_a_receber: number;
      total_spread: number;
    };
  };
}

interface Modalidade {
  modalidade: string;
  clientes: number;
  capital_emprestado: number;
  receita_mensal: number;
  parcelas_atrasadas: number;
  valor_em_atraso: number;
}

interface Vencimento {
  nome: string;
  modalidade: string;
  telefone: string;
  data_vencimento: string;
  numero_parcela: number;
  total_parcelas: number;
  valor: number;
  status: 'pendente' | 'atrasado';
}

interface Previsao {
  em_90_dias: number;
  em_180_dias: number;
  em_1_ano: number;
  em_2_anos: number;
}

interface Consolidado {
  detalhes: {
    spread_realizado_parcelas: number;
    adiantamentos_recebidos: { quantidade: number; total_enviado: number; total_receber: number; spread_adiantamento: number };
    adiantamentos_pendentes: { quantidade: number; total_enviado: number; total_receber: number; spread_adiantamento: number };
    capital_emprestado_carteira: number;
    total_recebido_parcelas: number;
    total_recebido_adiantamentos: number;
  };
  consolidado: {
    spread_total: number;
    total_recebido_geral: number;
    total_recebivel: number;
    total_recebivel_parcelas: number;
    total_recebivel_adiant: number;
  };
}

/* ─── styles ───────────────────────────────────────────────────── */
const styles = `
  .dash-root {
    min-height: 100vh;
    background: #F2F4F8;
    font-family: 'Arial', sans-serif;
    color: #1A2340;
    padding: 2.5rem 2.5rem 4rem;
  }

  .dash-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 3rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid #DDE1EC;
  }

  .dash-title {
    font-family: 'Arial', serif;
    font-size: 2rem;
    font-weight: 800;
    color: #0F1729;
    letter-spacing: -0.03em;
    margin: 0 0 0.25rem;
    line-height: 1.1;
  }

  .dash-title span {
    color: #4F63D2;
  }

  .dash-subtitle {
    font-size: 0.8rem;
    color: #8A96B4;
    font-weight: 400;
    letter-spacing: 0.01em;
  }

  .dash-badge {
    background: #fff;
    border: 1px solid #DDE1EC;
    border-radius: 10px;
    padding: 0.5rem 1rem;
    font-size: 0.7rem;
    font-weight: 600;
    color: #8A96B4;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  /* SECTION */
  .dash-section {
    margin-bottom: 2.5rem;
  }

  .dash-section-label {
    font-family: 'Arial', serif;
    font-size: 1rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: #3f517cff;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .dash-section-label::before {
    content: '';
    display: inline-block;
    width: 18px;
    height: 1px;
    background: #C8CEDF;
  }

  /* CARDS GRID */
  .cards-grid-6 {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 1px;
    background: #DDE1EC;
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid #DDE1EC;
  }

  .cards-grid-4 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1px;
    background: #DDE1EC;
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid #DDE1EC;
  }

  .cards-grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1px;
    background: #DDE1EC;
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid #DDE1EC;
  }

  /* HERO CARD ROW */
  .hero-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .hero-card {
    background: #fff;
    border: 1px solid #DDE1EC;
    border-radius: 16px;
    padding: 1.5rem 1.6rem;
    position: relative;
    overflow: hidden;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .hero-card:hover {
    border-color: #B8C0D8;
    box-shadow: 0 4px 20px rgba(79,99,210,0.06);
  }

  .hero-card::before {
    content: '';
    position: absolute;
    top: 0; right: 0;
    width: 100px; height: 100px;
    border-radius: 50%;
    opacity: 0.06;
    transform: translate(35%, -35%);
  }

  .hero-card.emerald::before { background: #059669; }
  .hero-card.violet::before  { background: #4F63D2; }
  .hero-card.amber::before   { background: #D97706; }

  .hero-card-icon {
    width: 34px; height: 34px;
    border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 1.25rem;
  }

  .hero-card-icon.emerald { background: #D1FAE5; color: #059669; }
  .hero-card-icon.violet  { background: #E0E4FA; color: #4F63D2; }
  .hero-card-icon.amber   { background: #FEF3C7; color: #D97706; }

  .hero-card-label {
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #A0ABCA;
    margin-bottom: 0.3rem;
  }

  .hero-card-value {
    font-family: 'Playfair Display', serif;
    font-size: 1.45rem;
    font-weight: 800;
    color: #0F1729;
    line-height: 1.2;
    letter-spacing: -0.02em;
  }

  .hero-card-sub {
    font-size: 0.7rem;
    color: #B0BBCC;
    margin-top: 0.3rem;
  }

  /* METRIC CELL */
  .metric-cell {
    background: #fff;
    padding: 1.25rem 1.4rem;
    transition: background 0.15s;
  }

  .metric-cell:hover { background: #FAFBFF; }

  .metric-cell-icon {
    width: 28px; height: 28px;
    border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 1rem;
    flex-shrink: 0;
  }

  .metric-cell-label {
    font-size: 0.6rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #767c8fff;
    margin-bottom: 0.3rem;
    line-height: 1.3;
  }

  .metric-cell-value {
    font-family: 'Arial', serif;
    font-size: 1rem;
    font-weight: 700;
    color: #1A2340;
    letter-spacing: -0.02em;
    line-height: 1.2;
  }

  .metric-cell-sub {
    font-size: 0.6rem;
    color: #C0C8D8;
    margin-top: 0.2rem;
  }

  /* COLOR VARIANTS FOR METRIC CELLS */
  .mc-indigo .metric-cell-icon  { background: #EEF0FC; color: #4F63D2; }
  .mc-emerald .metric-cell-icon { background: #D1FAE5; color: #059669; }
  .mc-blue .metric-cell-icon    { background: #DBEAFE; color: #2563EB; }
  .mc-violet .metric-cell-icon  { background: #EDE9FE; color: #7C3AED; }
  .mc-sky .metric-cell-icon     { background: #E0F2FE; color: #0284C7; }
  .mc-rose .metric-cell-icon    { background: #FFE4E6; color: #E11D48; }
  .mc-amber .metric-cell-icon   { background: #FEF3C7; color: #D97706; }
  .mc-slate .metric-cell-icon   { background: #F1F5F9; color: #64748B; }
  .mc-fuchsia .metric-cell-icon { background: #FAE8FF; color: #A21CAF; }

  /* STATUS PILLS */
  .pill {
    display: inline-block;
    font-size: 0.55rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 2px 7px;
    border-radius: 99px;
  }

  .pill-rose  { background: #FFE4E6; color: #BE123C; border: 1px solid #FECDD3; }
  .pill-amber { background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A; }

  /* TABLE */
  .dash-table-wrap {
    border-radius: 16px;
    border: 1px solid #DDE1EC;
    overflow: hidden;
    background: #fff;
  }

  .dash-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.78rem;
  }

  .dash-table thead tr {
    background: #F8F9FC;
    border-bottom: 1px solid #DDE1EC;
  }

  .dash-table thead th {
    padding: 0.85rem 1.2rem;
    font-size: 0.6rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #A0ABCA;
    text-align: left;
  }

  .dash-table thead th.danger { color: #F87171; }

  .dash-table tbody tr {
    border-bottom: 1px solid #F0F2F8;
    transition: background 0.12s;
  }

  .dash-table tbody tr:last-child { border-bottom: none; }
  .dash-table tbody tr:hover { background: #F8F9FD; }

  .dash-table tbody td {
    padding: 0.85rem 1.2rem;
    color: #7A88A8;
  }

  .dash-table tbody td.name  { font-family: 'Arial', serif; font-weight: 700; color: #2A3660; font-size: 0.78rem; }
  .dash-table tbody td.money { font-weight: 500; color: #3A4870; }
  .dash-table tbody td.red   { font-weight: 600; color: #E11D48; }

  /* VENCIMENTOS */
  .venc-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }

  .venc-card {
    background: #fff;
    border: 1px solid #DDE1EC;
    border-radius: 14px;
    padding: 1.1rem 1.2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .venc-card:hover {
    border-color: #B8C0D8;
    box-shadow: 0 2px 12px rgba(79,99,210,0.05);
  }

  .venc-card.atrasado {
    border-left: 3px solid #FECDD3;
  }

  .venc-name {
    font-family: 'Arial', serif;
    font-size: 0.78rem;
    font-weight: 700;
    color: #1A2340;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .venc-mod {
    font-size: 0.6rem;
    font-weight: 600;
    color: #4F63D2;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    margin-top: 2px;
  }

  .venc-phone {
    font-size: 0.6rem;
    color: #B0BBCC;
    margin-top: 2px;
  }

  .venc-amount {
    font-family: 'Arial', serif;
    font-size: 0.85rem;
    font-weight: 700;
    color: #0F1729;
    text-align: right;
  }

  .venc-date {
    font-size: 0.6rem;
    font-weight: 500;
    text-align: right;
    margin-top: 2px;
  }

  .venc-date.atrasado { color: #E11D48; }
  .venc-date.pendente { color: #D97706; }

  /* LOADING / ERROR */
  .dash-loading {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #F2F4F8;
    font-family: 'Arial', serif;
    color: #A0ABCA;
    font-size: 0.85rem;
    letter-spacing: 0.08em;
  }

  .dash-error { color: #E11D48; }

  @media (max-width: 1200px) {
    .cards-grid-6 { grid-template-columns: repeat(3, 1fr); }
    .hero-cards   { grid-template-columns: repeat(3, 1fr); }
    .venc-grid    { grid-template-columns: repeat(2, 1fr); }
  }

  @media (max-width: 800px) {
    .dash-root    { padding: 1.5rem; }
    .cards-grid-6 { grid-template-columns: repeat(2, 1fr); }
    .cards-grid-4 { grid-template-columns: repeat(2, 1fr); }
    .cards-grid-3 { grid-template-columns: repeat(1, 1fr); }
    .hero-cards   { grid-template-columns: repeat(1, 1fr); }
    .venc-grid    { grid-template-columns: repeat(1, 1fr); }
    .dash-table-wrap { overflow-x: auto; }
  }

  /* Dark Mode Overrides */
  html.dark .dash-root { background: #0B0F19; color: #F1F5F9; }
  html.dark .dash-header { border-color: rgba(255,255,255,0.1); }
  html.dark .dash-title { color: #fff; }
  html.dark .hero-card { background: rgba(30,41,59,0.5); border-color: rgba(255,255,255,0.1); }
  html.dark .hero-card-value { color: #fff; }
  html.dark .metric-cell { background: rgba(30,41,59,0.5); }
  html.dark .metric-cell:hover { background: rgba(51,65,85,0.5); }
  html.dark .metric-cell-value { color: #fff; }
  html.dark .cards-grid-6, html.dark .cards-grid-4, html.dark .cards-grid-3 { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.05); }
  html.dark .dash-badge { background: rgba(30,41,59,0.5); border-color: rgba(255,255,255,0.1); color: #94A3B8; }
  html.dark .dash-table-wrap { border-color: rgba(255,255,255,0.1); background: transparent; }
  html.dark .dash-table thead tr { background: rgba(30,41,59,0.8); border-color: rgba(255,255,255,0.1); }
  html.dark .dash-table tbody tr { border-color: rgba(255,255,255,0.05); }
  html.dark .dash-table tbody tr:hover { background: rgba(255,255,255,0.02); }
  html.dark .dash-table tbody td.name { color: #fff; }
  html.dark .dash-table tbody td.money { color: #E2E8F0; }
  html.dark .venc-card { background: rgba(30,41,59,0.5); border-color: rgba(255,255,255,0.1); }
  html.dark .venc-card:hover { border-color: rgba(129,140,248,0.3); }
  html.dark .venc-name, html.dark .venc-amount { color: #fff; }
  html.dark .dash-loading { background: #0B0F19; color: #fff; }
`;

/* ─── página ───────────────────────────────────────────────────── */
export const PaginaResumo: React.FC = () => {
  const [resumo,      setResumo]      = useState<Resumo | null>(null);
  const [modalidades, setModalidades] = useState<Modalidade[]>([]);
  const [vencimentos, setVencimentos] = useState<Vencimento[]>([]);
  const [previsao,    setPrevisao]    = useState<Previsao | null>(null);
  const [consolidado, setConsolidado] = useState<Consolidado | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [erro,        setErro]        = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [res, mod, ven, prev, cons] = await Promise.all([
          DashboardService.resumoGeral(),
          DashboardService.porModalidade(),
          DashboardService.vencimentosProximos(7),
          DashboardService.previsaoRecebimentos(),
          DashboardService.relatorioConsolidado(),
        ]);
        setResumo(res.data);
        setModalidades(mod.data);
        setVencimentos(ven.data);
        setPrevisao(prev.data);
        setConsolidado(cons.data);
      } catch (e) {
        console.error(e);
        setErro('Não foi possível carregar o dashboard.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F2F4F8', fontFamily: 'DM Sans, sans-serif', color: '#A0ABCA', fontSize: '0.85rem', letterSpacing: '0.08em' }}>
      <style>{styles}</style>
      <span>Carregando dashboard…</span>
    </div>
  );

  if (erro || !resumo) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F2F4F8', fontFamily: 'DM Sans, sans-serif', color: '#E11D48', fontSize: '0.85rem' }}>
      <style>{styles}</style>
      <span>{erro ?? 'Erro desconhecido.'}</span>
    </div>
  );

  const { carteira, inadimplencia, parcelas_por_status, adiantamentos } = resumo;

  const parc = (status: string) => parcelas_por_status.find(p => p.status === status);
  const adP  = adiantamentos.por_status.find(a => a.status === 'pendente');
  const adPg = adiantamentos.por_status.find(a => a.status === 'recebido');

  return (
    <div className="dash-root">
      <style>{styles}</style>

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header className="dash-header">
        <div>
          <h1 className="dash-title">
            Dashboard <span>Financeiro</span>
          </h1>
          <p className="dash-subtitle">
            {carteira.total_contratos} contratos ativos · {carteira.total_clientes} clientes
          </p>
        </div>
        <div className="dash-badge">
          {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </div>
      </header>

      {/* ── 4. RELATÓRIO CONSOLIDADO ───────────────────────────────── */}
      {consolidado && (
        <Secao titulo="Relatório Total Geral">
          <div className="hero-cards">
            <HeroCard
              titulo="Total Recebido Geral"
              valor={moeda(consolidado.consolidado.total_recebido_geral)}
              sub="Parcelas + adiantamentos"
              variante="emerald"
              icon={<ArrowUpRight size={16} />}
            />
            <HeroCard
              titulo="Spread Total Consolidado"
              valor={moeda(consolidado.consolidado.spread_total)}
              sub="Spread parcelas + adiantamentos"
              variante="violet"
              icon={<TrendingUp size={16} />}
            />
            <HeroCard
              titulo="Total a Receber"
              valor={moeda(consolidado.consolidado.total_recebivel)}
              sub="Parcelas + adiant. pendentes"
              variante="amber"
              icon={<DollarSign size={16} />}
            />
          </div>
        </Secao>
      )}

      {/* ── 1. CARTEIRA ATIVA ──────────────────────────────────────── */}
      <Secao titulo="Clientes PJ · PF e Consignados">
        <div className="cards-grid-6">
          <MetricCell titulo="Capital Emprestado"    valor={moeda(carteira.capital_total_emprestado)}   sub={`${carteira.total_contratos} contratos ativos`}    cor="mc-indigo"  icon={<Wallet size={14}/>} />
          <MetricCell titulo="Montante Recebido"     valor={moeda(carteira.montante_total_recebido)}    sub="Total já recebido"                                  cor="mc-emerald" icon={<PiggyBank size={14}/>} />
          <MetricCell titulo="Receita Mensal Esp."   valor={moeda(carteira.receita_mensal_esperada)}    sub="Soma das parcelas mensais"                          cor="mc-blue"    icon={<BarChart3 size={14}/>} />
          <MetricCell titulo="Spread Total Carteira" valor={moeda(carteira.spread_total_carteira)}      sub="Lucro projetado bruto"                              cor="mc-violet"  icon={<TrendingUp size={14}/>} />
          <MetricCell titulo="Clientes Ativos"       valor={String(carteira.total_clientes)}            sub={`${carteira.total_contratos} contratos`}            cor="mc-sky"     icon={<Users size={14}/>} />
          <MetricCell titulo="Total em Atraso"       valor={moeda(inadimplencia.total_em_atraso)}       sub={`${inadimplencia.clientes_inadimplentes} inadimp.`} cor="mc-rose"    icon={<AlertCircle size={14}/>} />
        </div>
      </Secao>

      {/* ── 2. PARCELAS POR STATUS ─────────────────────────────────── */}
      <Secao titulo="Parcelas por Status">
        <div className="cards-grid-3">
          <MetricCell titulo="Parcelas Pagas"     valor={moeda(parc('pago')?.total_valor)}     sub={`${parc('pago')?.qtd ?? 0} parcelas`}     cor="mc-emerald" icon={<CheckCircle size={14}/>} />
          <MetricCell titulo="Parcelas Pendentes" valor={moeda(parc('pendente')?.total_valor)} sub={`${parc('pendente')?.qtd ?? 0} parcelas`} cor="mc-amber"   icon={<Clock size={14}/>} />
          <MetricCell titulo="Parcelas Atrasadas" valor={moeda(parc('atrasado')?.total_valor)} sub={`${parc('atrasado')?.qtd ?? 0} parcelas`} cor="mc-rose"    icon={<XCircle size={14}/>} />
        </div>
      </Secao>

      {/* ── 3. ADIANTAMENTOS ───────────────────────────────────────── */}
      <Secao titulo="Adiantamentos — Totais Gerais">
        <div className="cards-grid-4">
          <MetricCell titulo="Total Quantidade"  valor={String(adiantamentos.totais.quantidade)}     sub="Todos os adiantamentos" cor="mc-slate"   icon={<Activity size={14}/>} />
          <MetricCell titulo="Total Enviado"     valor={moeda(adiantamentos.totais.total_enviado)}   sub="Capital total enviado"  cor="mc-slate"   icon={<DollarSign size={14}/>} />
          <MetricCell titulo="Total a Receber"   valor={moeda(adiantamentos.totais.total_a_receber)} sub="Total geral a receber"  cor="mc-slate"   icon={<ArrowUpRight size={14}/>} />
          <MetricCell titulo="Total Spread"      valor={moeda(adiantamentos.totais.total_spread)}    sub="Spread total"           cor="mc-slate"   icon={<TrendingUp size={14}/>} />
        </div>
      </Secao>

      <Secao titulo="Adiantamentos — Pendentes">
        <div className="cards-grid-4">
          <MetricCell titulo="Quantidade"    valor={String(adP?.quantidade ?? 0)} sub="Adiantamentos pendentes" cor="mc-amber" icon={<Banknote size={14}/>} />
          <MetricCell titulo="Total Enviado" valor={moeda(adP?.total_enviado)}    sub="Capital enviado"         cor="mc-amber" icon={<DollarSign size={14}/>} />
          <MetricCell titulo="A Receber"     valor={moeda(adP?.total_a_receber)}  sub="Total a receber"         cor="mc-amber" icon={<ArrowUpRight size={14}/>} />
          <MetricCell titulo="Spread"        valor={moeda(adP?.total_spread)}     sub="Spread previsto"         cor="mc-amber" icon={<TrendingUp size={14}/>} />
        </div>
      </Secao>

      <Secao titulo="Adiantamentos — Recebidos">
        <div className="cards-grid-4">
          <MetricCell titulo="Quantidade"     valor={String(adPg?.quantidade ?? 0)} sub="Adiantamentos recebidos" cor="mc-emerald" icon={<Banknote size={14}/>} />
          <MetricCell titulo="Total Enviado"  valor={moeda(adPg?.total_enviado)}     sub="Capital enviado"         cor="mc-emerald" icon={<DollarSign size={14}/>} />
          <MetricCell titulo="Total Recebido" valor={moeda(adPg?.total_a_receber)}   sub="Total recebido"          cor="mc-emerald" icon={<ArrowUpRight size={14}/>} />
          <MetricCell titulo="Spread"         valor={moeda(adPg?.total_spread)}      sub="Spread realizado"        cor="mc-emerald" icon={<TrendingUp size={14}/>} />
        </div>
      </Secao>

      {/* ── 5. PREVISÃO DE RECEBIMENTOS ────────────────────────────── */}
      {previsao && (
        <Secao titulo="Previsão de Recebimentos">
          <div className="cards-grid-4">
            <MetricCell titulo="Em 90 Dias"  valor={moeda(previsao.em_90_dias)}  sub="Parcelas pend./atrasadas" cor="mc-sky"  icon={<Calendar size={14}/>} />
            <MetricCell titulo="Em 180 Dias" valor={moeda(previsao.em_180_dias)} sub="Parcelas pend./atrasadas" cor="mc-sky"  icon={<Calendar size={14}/>} />
            <MetricCell titulo="Em 1 Ano"    valor={moeda(previsao.em_1_ano)}    sub="Parcelas pend./atrasadas" cor="mc-blue" icon={<Calendar size={14}/>} />
            <MetricCell titulo="Em 2 Anos"   valor={moeda(previsao.em_2_anos)}   sub="Parcelas pend./atrasadas" cor="mc-blue" icon={<Calendar size={14}/>} />
          </div>
        </Secao>
      )}

      {/* ── 6. MODALIDADES ─────────────────────────────────────────── */}
      <Secao titulo="Performance por Modalidade">
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Modalidade</th>
                <th>Clientes</th>
                <th>Capital</th>
                <th>Receita Mensal</th>
                <th className="danger">Em Atraso</th>
                <th className="danger">Parc. Atrasadas</th>
              </tr>
            </thead>
            <tbody>
              {modalidades.map((m, i) => (
                <tr key={i}>
                  <td className="name">{m.modalidade}</td>
                  <td>{m.clientes}</td>
                  <td className="money">{moeda(m.capital_emprestado)}</td>
                  <td className="money">{moeda(m.receita_mensal)}</td>
                  <td className="red">{moeda(m.valor_em_atraso)}</td>
                  <td>{m.parcelas_atrasadas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Secao>

      {/* ── 7. VENCIMENTOS PRÓXIMOS ────────────────────────────────── */}
      <Secao titulo="Vencimentos Próximos (7 dias)">
        {vencimentos.length === 0 ? (
          <p style={{ color: '#2D3A55', fontSize: '0.8rem', fontStyle: 'italic' }}>
            Nenhum vencimento nos próximos 7 dias.
          </p>
        ) : (
          <div className="venc-grid">
            {vencimentos.map((v, i) => (
              <div key={i} className={`venc-card ${v.status}`}>
                <div style={{ minWidth: 0 }}>
                  <p className="venc-name">{v.nome}</p>
                  <p className="venc-mod">{v.modalidade} · {v.numero_parcela}/{v.total_parcelas}</p>
                  {v.telefone && <p className="venc-phone">{v.telefone}</p>}
                </div>
                <div style={{ flexShrink: 0 }}>
                  <p className="venc-amount">{moeda(v.valor)}</p>
                  <p className={`venc-date ${v.status}`}>{fmtData(v.data_vencimento)}</p>
                  <div style={{ textAlign: 'right', marginTop: '4px' }}>
                    <span className={`pill pill-${v.status === 'atrasado' ? 'rose' : 'amber'}`}>
                      {v.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Secao>
    </div>
  );
};

/* ─── sub-componentes ──────────────────────────────────────────── */

const Secao: React.FC<{ titulo: string; children: React.ReactNode }> = ({ titulo, children }) => (
  <section className="dash-section">
    <p className="dash-section-label">{titulo}</p>
    {children}
  </section>
);

const HeroCard = ({
  titulo, valor, sub, variante, icon,
}: {
  titulo: string; valor: string; sub: string;
  variante: 'emerald' | 'violet' | 'amber';
  icon: React.ReactNode;
}) => (
  <div className={`hero-card ${variante}`}>
    <div className={`hero-card-icon ${variante}`}>{icon}</div>
    <p className="hero-card-label">{titulo}</p>
    <p className="hero-card-value">{valor}</p>
    <p className="hero-card-sub">{sub}</p>
  </div>
);

const MetricCell = ({
  titulo, valor, sub, cor, icon,
}: {
  titulo: string; valor: string; sub: string; cor: string; icon: React.ReactNode;
}) => (
  <div className={`metric-cell ${cor}`}>
    <div className="metric-cell-icon">{icon}</div>
    <p className="metric-cell-label">{titulo}</p>
    <p className="metric-cell-value">{valor}</p>
    <p className="metric-cell-sub">{sub}</p>
  </div>
);