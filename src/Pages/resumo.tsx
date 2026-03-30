import React, { useEffect, useState } from 'react';
import { 
  Users, Wallet, TrendingUp, AlertCircle, 
  Calendar, ArrowRight, BarChart3, Building2 
} from 'lucide-react';
import { DashboardService } from '../api/api';

export const PaginaResumo: React.FC = () => {
  const [resumo, setResumo] = useState<any>(null);
  const [modalidades, setModalidades] = useState<any[]>([]);
  const [vencimentos, setVencimentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const formatarMoeda = (v: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

  const carregarDashboard = async () => {
    setLoading(true);
    try {
      const [res, mod, ven] = await Promise.all([
        DashboardService.resumoGeral(),
        DashboardService.porModalidade(),
        DashboardService.vencimentosProximos(7)
      ]);
      setResumo(res.data);
      setModalidades(mod.data);
      setVencimentos(ven.data);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregarDashboard(); }, []);

  if (loading) return <div className="p-20 text-center font-bold text-slate-400">Sincronizando Metropolitan...</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8 space-y-8 font-sans">
      
      {/* HEADER */}
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Dashboard <span className="text-indigo-600">Financeiro</span>
          </h1>
          <p className="text-slate-500 font-medium">Visão consolidada da carteira e inadimplência.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-2xl border shadow-sm text-sm font-bold text-slate-600">
          {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}
        </div>
      </header>

      {/* 1. CARDS PRINCIPAIS (Resumo Geral) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <CardResumo 
          titulo="Total na Carteira" 
          valor={formatarMoeda(resumo.carteira.montante_total_carteira)} 
          sub={`Em ${resumo.carteira.total_contratos} contratos`} 
          cor="bg-indigo-600" icon={<Wallet size={24}/>} 
        />
        <CardResumo 
          titulo="Spread Total" 
          valor={formatarMoeda(resumo.carteira.spread_total_carteira)} 
          sub="Lucro projetado bruto" 
          cor="bg-emerald-500" icon={<TrendingUp size={24}/>} 
        />
        <CardResumo 
          titulo="Receita Mensal Esperada" 
          valor={formatarMoeda(resumo.carteira.receita_mensal_esperada)} 
          sub="Baseado nas parcelas do mês" 
          cor="bg-blue-500" icon={<BarChart3 size={24}/>} 
        />
        <CardResumo 
          titulo="Total em Atraso" 
          valor={formatarMoeda(resumo.inadimplencia.total_em_atraso)} 
          sub={`${resumo.inadimplencia.clientes_inadimplentes} clientes pendentes`} 
          cor="bg-rose-500" icon={<AlertCircle size={24}/>} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. TABELA POR MODALIDADE (IPD, WIZZER, etc) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center gap-3">
            <Building2 className="text-indigo-600" />
            <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest">Performance por Modalidade</h2>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100">
                <th className="px-6 py-4">MODALIDADE</th>
                <th className="px-6 py-4">CLIENTES</th>
                <th className="px-6 py-4">RECEITA MENSAL</th>
                <th className="px-6 py-4 text-rose-500">EM ATRASO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {modalidades.map((m, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-black text-slate-700">{m.modalidade}</td>
                  <td className="px-6 py-4 font-medium">{m.clientes}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">{formatarMoeda(m.receita_mensal)}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-rose-600 font-bold">{formatarMoeda(m.valor_em_atraso)}</span>
                      <span className="text-[10px] text-slate-400">{m.parcelas_atrasadas} parcelas</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 3. VENCIMENTOS PRÓXIMOS (7 DIAS) */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="text-indigo-600" />
            <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest">Próximos 7 Dias</h2>
          </div>
          <div className="space-y-4">
            {vencimentos.map((v, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-sm font-bold text-slate-800 leading-tight">{v.nome}</p>
                  <p className="text-[10px] font-black text-indigo-500 uppercase">{v.modalidade} • PARCELA {v.numero_parcela}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900">{formatarMoeda(v.valor)}</p>
                  <p className={`text-[10px] font-bold ${v.status === 'atrasado' ? 'text-rose-500' : 'text-amber-500'}`}>
                    VENCE {new Date(v.data_vencimento).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
            {vencimentos.length === 0 && <p className="text-center py-10 text-slate-400 italic">Nenhum vencimento próximo.</p>}
          </div>
        </div>

      </div>
    </div>
  );
};

// Componente Auxiliar para os Cards
const CardResumo = ({ titulo, valor, sub, cor, icon }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
    <div className={`absolute top-0 right-0 w-24 h-24 ${cor} opacity-5 -mr-8 -mt-8 rounded-full group-hover:scale-110 transition-transform`}></div>
    <div className="relative z-10">
      <div className={`p-2 w-10 h-10 rounded-xl mb-4 text-white flex items-center justify-center ${cor}`}>
        {icon}
      </div>
      <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">{titulo}</p>
      <h3 className="text-2xl font-black text-slate-900 my-1">{valor}</h3>
      <p className="text-xs font-bold text-slate-400">{sub}</p>
    </div>
  </div>
);