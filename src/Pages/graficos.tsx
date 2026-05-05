import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
} from 'recharts';
import { DashboardService } from '../api/api';
import {
  TrendingUp, DollarSign, ArrowUpRight, RefreshCw,
  BarChart2, PieChart as PieIcon, Activity, AlertTriangle,
} from 'lucide-react';

/* ── helpers ─────────────────────────────────────────────────────── */
const moeda = (v: number | null | undefined) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const moedaK = (v: number) => {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `R$ ${(v / 1_000).toFixed(0)}k`;
  return `R$ ${v}`;
};

/* ── tipos ──────────────────────────────────────────────────────── */
interface Resumo {
  carteira: { total_clientes: number; total_contratos: number; capital_total_emprestado: number; montante_total_recebido: number; receita_mensal_esperada: number; spread_total_carteira: number };
  parcelas_por_status: { status: string; qtd: number; total_valor: number }[];
  inadimplencia: { clientes_inadimplentes: number; total_em_atraso: number };
  adiantamentos: { por_status: { status: string; quantidade: number; total_enviado: number; total_a_receber: number; total_spread: number }[]; totais: { quantidade: number; total_enviado: number; total_a_receber: number; total_spread: number } };
}
interface Modalidade { modalidade: string; clientes: number; capital_emprestado: number; receita_mensal: number; parcelas_atrasadas: number; valor_em_atraso: number }
interface Previsao { em_90_dias: number; em_180_dias: number; em_1_ano: number; em_2_anos: number }
interface Consolidado {
  detalhes: { spread_realizado_parcelas: number; adiantamentos_recebidos: any; adiantamentos_pendentes: any; capital_emprestado_carteira: number; total_recebido_parcelas: number; total_recebido_adiantamentos: number };
  consolidado: { spread_total: number; total_recebido_geral: number; total_recebivel: number; total_recebivel_parcelas: number; total_recebivel_adiant: number };
}

/* ── paleta ─────────────────────────────────────────────────────── */
const C = { indigo: '#818CF8', emerald: '#34D399', amber: '#FBBF24', rose: '#FB7185', sky: '#38BDF8', violet: '#A78BFA', slate: '#64748B' };
const STATUS_COR: Record<string, string> = { pago: C.emerald, pendente: C.amber, atrasado: C.rose };

/* ── CSS ────────────────────────────────────────────────────────── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

.gp *, .gp *::before, .gp *::after { box-sizing: border-box; margin: 0; padding: 0; }

.gp { background:#0B0F1A; font-family:'Inter',sans-serif; color:#E2E8F0; padding:2rem 2.5rem 5rem; min-height:100%; }

.gp-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:2.5rem; padding-bottom:1.5rem; border-bottom:1px solid rgba(255,255,255,0.07); }
.gp-title { font-size:1.75rem; font-weight:800; color:#F1F5F9; letter-spacing:-0.04em; }
.gp-title span { background:linear-gradient(135deg,#818CF8,#A78BFA); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
.gp-sub { font-size:0.78rem; color:#64748B; margin-top:0.25rem; }
.gp-refresh { display:flex; align-items:center; gap:6px; padding:0.55rem 1.1rem; background:rgba(129,140,248,0.1); border:1px solid rgba(129,140,248,0.25); border-radius:10px; color:#818CF8; font-size:0.75rem; font-weight:600; cursor:pointer; transition:all 0.2s; letter-spacing:0.05em; }
.gp-refresh:hover { background:rgba(129,140,248,0.2); transform:scale(1.03); }
.gp-refresh.spin svg { animation:spin 0.8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }

.kpi-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:1rem; margin-bottom:2rem; }
.kpi { position:relative; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:1.4rem 1.5rem; overflow:hidden; transition:all 0.25s; cursor:default; }
.kpi::before { content:''; position:absolute; inset:0; background:radial-gradient(circle at 80% 20%, var(--kc) 0%, transparent 60%); opacity:0.07; pointer-events:none; }
.kpi:hover { border-color:rgba(255,255,255,0.15); transform:translateY(-2px); box-shadow:0 12px 40px rgba(0,0,0,0.4); }
.kpi-icon { width:38px; height:38px; border-radius:10px; display:flex; align-items:center; justify-content:center; margin-bottom:1rem; }
.kpi-label { font-size:0.62rem; font-weight:600; text-transform:uppercase; letter-spacing:0.1em; color:#64748B; margin-bottom:0.35rem; }
.kpi-value { font-size:1.45rem; font-weight:800; color:#F1F5F9; letter-spacing:-0.03em; line-height:1.2; }
.kpi-delta { font-size:0.68rem; color:#94A3B8; margin-top:0.3rem; }

.sec { margin-bottom:2rem; }
.sec-label { font-size:0.62rem; font-weight:700; text-transform:uppercase; letter-spacing:0.14em; color:#475569; display:flex; align-items:center; gap:0.6rem; margin-bottom:1rem; }
.sec-label::before { content:''; width:20px; height:1px; background:linear-gradient(90deg,#818CF8,transparent); }

.grid2 { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
.grid3 { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; }

.card { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:1.5rem; transition:all 0.25s; }
.card:hover { border-color:rgba(129,140,248,0.25); box-shadow:0 8px 32px rgba(0,0,0,0.3); }
.card-title { font-size:0.75rem; font-weight:600; color:#94A3B8; margin-bottom:1.2rem; letter-spacing:0.02em; }

.leg { display:flex; gap:1rem; flex-wrap:wrap; justify-content:center; margin-top:1rem; }
.leg-item { display:flex; align-items:center; gap:5px; font-size:0.67rem; color:#64748B; font-weight:500; }
.leg-dot { width:8px; height:8px; border-radius:50%; }

.tab-row { display:flex; gap:0.5rem; margin-bottom:1rem; }
.tab { padding:0.4rem 0.9rem; border-radius:8px; font-size:0.7rem; font-weight:600; cursor:pointer; border:1px solid rgba(255,255,255,0.08); background:transparent; color:#64748B; transition:all 0.2s; letter-spacing:0.04em; }
.tab.active { background:rgba(129,140,248,0.15); border-color:rgba(129,140,248,0.4); color:#818CF8; }

.tip { background:#111827; border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:0.7rem 1rem; font-family:'Inter',sans-serif; font-size:0.72rem; box-shadow:0 8px 24px rgba(0,0,0,0.5); }
.tip-label { color:#64748B; font-size:0.6rem; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:4px; }
.tip-row { display:flex; align-items:center; gap:6px; color:#E2E8F0; font-weight:600; margin:2px 0; }
.tip-dot { width:7px; height:7px; border-radius:50%; }

.loading { min-height:calc(100vh - 0px); display:flex; flex-direction:column; align-items:center; justify-content:center; background:#0B0F1A; gap:1rem; }
.spinner { width:40px; height:40px; border:3px solid rgba(129,140,248,0.15); border-top-color:#818CF8; border-radius:50%; animation:spin 0.8s linear infinite; }
.loading-text { font-family:'Inter',sans-serif; font-size:0.8rem; color:#475569; letter-spacing:0.1em; }

@media(max-width:900px) { .grid2,.grid3,.kpi-grid { grid-template-columns:1fr; } .gp { padding:1.2rem; } }

/* Light Mode Overrides */
html:not(.dark) .gp { background: #F8FAFC; color: #1E293B; }
html:not(.dark) .gp-header { border-color: rgba(0,0,0,0.05); }
html:not(.dark) .gp-title { color: #0F172A; }
html:not(.dark) .kpi { background: #FFFFFF; border-color: rgba(0,0,0,0.05); box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
html:not(.dark) .kpi:hover { border-color: rgba(0,0,0,0.1); box-shadow: 0 12px 30px rgba(0,0,0,0.08); }
html:not(.dark) .kpi-value { color: #0F172A; }
html:not(.dark) .card { background: #FFFFFF; border-color: rgba(0,0,0,0.05); box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
html:not(.dark) .card:hover { border-color: rgba(129,140,248,0.3); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
html:not(.dark) .tab { border-color: rgba(0,0,0,0.08); }
html:not(.dark) .tip { background: #FFFFFF; border-color: rgba(0,0,0,0.1); box-shadow: 0 8px 24px rgba(0,0,0,0.15); color: #0F172A; }
html:not(.dark) .tip-row { color: #1E293B; }
html:not(.dark) .loading { background: #F8FAFC; }
`;

/* ── tooltip ─────────────────────────────────────────────────────── */
const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="tip">
      {label && <p className="tip-label">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="tip-row">
          <span className="tip-dot" style={{ background: p.color ?? p.fill ?? '#818CF8' }} />
          <span style={{ color: '#94A3B8' }}>{p.name}:</span>
          <span>{typeof p.value === 'number' ? moedaK(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

const tick = { fontFamily: 'Inter', fontSize: 10, fill: '#475569' };

/* ══════════════════════════════════════════════════════════════════ */
export const PaginaGraficos: React.FC = () => {
  const [resumo,      setResumo]      = useState<Resumo | null>(null);
  const [modalidades, setModalidades] = useState<Modalidade[]>([]);
  const [previsao,    setPrevisao]    = useState<Previsao | null>(null);
  const [consolidado, setConsolidado] = useState<Consolidado | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [spinning,    setSpinning]    = useState(false);
  const [erro,        setErro]        = useState<string | null>(null);
  const [abaModal,    setAbaModal]    = useState<'capital' | 'atraso' | 'clientes'>('capital');

  const carregar = useCallback(async (spin = false) => {
    spin ? setSpinning(true) : setLoading(true);
    setErro(null);
    try {
      const [res, mod, prev, cons] = await Promise.all([
        DashboardService.resumoGeral(),
        DashboardService.porModalidade(),
        DashboardService.previsaoRecebimentos(),
        DashboardService.relatorioConsolidado(),
      ]);
      setResumo(res.data);
      setModalidades(mod.data);
      setPrevisao(prev.data);
      setConsolidado(cons.data);
    } catch (e) {
      setErro('Não foi possível carregar os dados.');
    } finally {
      setLoading(false);
      setSpinning(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  if (loading) return (
    <div className="loading">
      <style>{css}</style>
      <div className="spinner" />
      <p className="loading-text">Carregando análises…</p>
    </div>
  );

  if (erro || !resumo) return (
    <div className="loading">
      <style>{css}</style>
      <AlertTriangle size={32} color="#FB7185" />
      <p style={{ color: '#FB7185', fontFamily: 'Inter', fontSize: '0.85rem' }}>{erro ?? 'Erro ao carregar.'}</p>
    </div>
  );

  /* ── dados derivados ─────────────────────────────────────────── */
  const donutParcelas = resumo.parcelas_por_status.map(p => ({
    name: p.status.charAt(0).toUpperCase() + p.status.slice(1),
    value: p.total_valor, qtd: p.qtd,
    cor: STATUS_COR[p.status] ?? C.slate,
  }));

  const adiantBarra = resumo.adiantamentos.por_status.map(a => ({
    name: a.status === 'pendente' ? 'Pendentes' : 'Recebidos',
    Enviado: a.total_enviado, 'A Receber': a.total_a_receber, Spread: a.total_spread,
  }));

  const previsaoBarra = previsao ? [
    { periodo: '90d', valor: previsao.em_90_dias },
    { periodo: '180d', valor: previsao.em_180_dias },
    { periodo: '1 ano', valor: previsao.em_1_ano },
    { periodo: '2 anos', valor: previsao.em_2_anos },
  ] : [];

  const modalCapital  = modalidades.map(m => ({ name: m.modalidade, Capital: m.capital_emprestado, 'Rec. Mensal': m.receita_mensal, 'Em Atraso': m.valor_em_atraso, Clientes: m.clientes, 'Parc. Atrasadas': m.parcelas_atrasadas }));

  const consolidadoBarra = consolidado ? [
    { name: 'Recebido', valor: consolidado.consolidado.total_recebido_geral, fill: C.emerald },
    { name: 'A Receber', valor: consolidado.consolidado.total_recebivel, fill: C.indigo },
    { name: 'Spread', valor: consolidado.consolidado.spread_total, fill: C.violet },
  ] : [];

  const abaDataKey = abaModal === 'capital' ? 'Capital' : abaModal === 'atraso' ? 'Em Atraso' : 'Clientes';
  const abaCor = abaModal === 'capital' ? C.indigo : abaModal === 'atraso' ? C.rose : C.sky;

  return (
    <div className="gp">
      <style>{css}</style>

      {/* HEADER */}
      <header className="gp-header">
        <div>
          <h1 className="gp-title">Análise <span>Gráfica</span></h1>
          <p className="gp-sub">Visão consolidada da carteira · {modalidades.length} modalidades ativas</p>
        </div>
        <button className={`gp-refresh${spinning ? ' spin' : ''}`} onClick={() => carregar(true)}>
          <RefreshCw size={13} /> Atualizar
        </button>
      </header>

      {/* KPIs */}
      {consolidado && (
        <div className="kpi-grid">
          {[
            { label: 'Total Recebido', value: moeda(consolidado.consolidado.total_recebido_geral), sub: 'Parcelas + adiantamentos', cor: C.emerald, icon: <ArrowUpRight size={17} />, bg: 'rgba(52,211,153,0.15)' },
            { label: 'Spread Consolidado', value: moeda(consolidado.consolidado.spread_total), sub: 'Lucro realizado + previsto', cor: C.violet, icon: <TrendingUp size={17} />, bg: 'rgba(167,139,250,0.15)' },
            { label: 'Total a Receber', value: moeda(consolidado.consolidado.total_recebivel), sub: 'Parcelas + adiant. pendentes', cor: C.amber, icon: <DollarSign size={17} />, bg: 'rgba(251,191,36,0.15)' },
            { label: 'Inadimplência', value: moeda(resumo.inadimplencia.total_em_atraso), sub: `${resumo.inadimplencia.clientes_inadimplentes} clientes em atraso`, cor: C.rose, icon: <AlertTriangle size={17} />, bg: 'rgba(251,113,133,0.15)' },
            { label: 'Receita Mensal Esperada', value: moeda(resumo.carteira.receita_mensal_esperada), sub: 'Competência atual', cor: C.sky, icon: <BarChart2 size={17} />, bg: 'rgba(56,189,248,0.15)' },
            { label: 'Capital Emprestado', value: moeda(resumo.carteira.capital_total_emprestado), sub: `${resumo.carteira.total_clientes} clientes`, cor: C.indigo, icon: <Activity size={17} />, bg: 'rgba(129,140,248,0.15)' },
          ].map((k, i) => (
            <div key={i} className="kpi" style={{ '--kc': k.cor } as any}>
              <div className="kpi-icon" style={{ background: k.bg, color: k.cor }}>{k.icon}</div>
              <p className="kpi-label">{k.label}</p>
              <p className="kpi-value">{k.value}</p>
              <p className="kpi-delta">{k.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── 1. PARCELAS + ADIANTAMENTOS ───────────────────────────── */}
      <section className="sec">
        <p className="sec-label"><PieIcon size={12} /> Parcelas e Adiantamentos</p>
        <div className="grid2">

          <div className="card">
            <p className="card-title">Parcelas por Status — Valor (R$)</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={donutParcelas} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={4} dataKey="value">
                  {donutParcelas.map((e, i) => <Cell key={i} fill={e.cor} strokeWidth={0} />)}
                </Pie>
                <Tooltip content={<Tip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="leg">
              {donutParcelas.map((p, i) => (
                <div key={i} className="leg-item">
                  <span className="leg-dot" style={{ background: p.cor }} />
                  {p.name} ({p.qtd})
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <p className="card-title">Adiantamentos — Enviado · A Receber · Spread</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={adiantBarra} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" tick={tick} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={moedaK} tick={tick} axisLine={false} tickLine={false} width={70} />
                <Tooltip content={<Tip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="Enviado"    fill={C.indigo}  radius={[6,6,0,0]} />
                <Bar dataKey="A Receber" fill={C.emerald} radius={[6,6,0,0]} />
                <Bar dataKey="Spread"    fill={C.violet}  radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="leg">
              {[['Enviado', C.indigo], ['A Receber', C.emerald], ['Spread', C.violet]].map(([n, c]) => (
                <div key={n} className="leg-item"><span className="leg-dot" style={{ background: c }} />{n}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. MODALIDADES ─────────────────────────────────────────── */}
      <section className="sec">
        <p className="sec-label"><BarChart2 size={12} /> Performance por Modalidade</p>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <p className="card-title" style={{ margin: 0 }}>Comparativo por Modalidade</p>
            <div className="tab-row" style={{ margin: 0 }}>
              {(['capital', 'atraso', 'clientes'] as const).map(a => (
                <button key={a} className={`tab${abaModal === a ? ' active' : ''}`} onClick={() => setAbaModal(a)}>
                  {a === 'capital' ? 'Capital' : a === 'atraso' ? 'Em Atraso' : 'Clientes'}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={modalCapital} layout="vertical" barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" tickFormatter={abaModal === 'clientes' ? (v) => String(v) : moedaK} tick={tick} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={tick} axisLine={false} tickLine={false} width={90} />
              <Tooltip content={<Tip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey={abaDataKey} fill={abaCor} radius={[0,6,6,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ── 3. PREVISÃO + CONSOLIDADO ──────────────────────────────── */}
      <section className="sec">
        <p className="sec-label"><Activity size={12} /> Previsão e Consolidado</p>
        <div className="grid2">

          <div className="card">
            <p className="card-title">Previsão de Recebimentos</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={previsaoBarra}>
                <defs>
                  <linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.indigo} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={C.indigo} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="periodo" tick={tick} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={moedaK} tick={tick} axisLine={false} tickLine={false} width={70} />
                <Tooltip content={<Tip />} />
                <Area type="monotone" dataKey="valor" name="Previsão" stroke={C.indigo} strokeWidth={2.5} fill="url(#gArea)" dot={{ r: 5, fill: C.indigo, strokeWidth: 0 }} activeDot={{ r: 7 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <p className="card-title">Consolidado Geral — Recebido · A Receber · Spread</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={consolidadoBarra} barCategoryGap="40%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" tick={tick} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={moedaK} tick={tick} axisLine={false} tickLine={false} width={70} />
                <Tooltip content={<Tip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="valor" name="Valor" radius={[8,8,0,0]}>
                  {consolidadoBarra.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="leg">
              {consolidadoBarra.map(d => (
                <div key={d.name} className="leg-item"><span className="leg-dot" style={{ background: d.fill }} />{d.name}</div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};