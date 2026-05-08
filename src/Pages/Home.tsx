import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Wallet, AlertCircle, TrendingUp,
  Plus, Search, ChevronRight, Filter
} from 'lucide-react';
import { ClienteService, DashboardService } from '../api/api';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export const PaginaPrincipal: React.FC = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<any[]>([]);
  const [resumo, setResumo] = useState<any>(null);
  const [evolucao, setEvolucao] = useState<any[]>([]); // NOVO
  const [busca, setBusca] = useState<string>(() => 
    localStorage.getItem('filtro_busca') || ''
  );
  const [modalidadeFiltro, setModalidadeFiltro] = useState<string>(() => 
    localStorage.getItem('filtro_modalidade') || 'TODAS'
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [processandoId, setProcessandoId] = useState<number | null>(null);

  const modalidadesDisponiveis = useMemo(() => {
    const mods = clientes.map(c => c.modalidade).filter(Boolean);
    return ['TODAS', ...Array.from(new Set(mods))];
  }, [clientes]);

  const clientesFiltrados = useMemo(() => {
    return clientes.filter(cliente => {
      const correspondeBusca =
        cliente.nome.toLowerCase().includes(busca.toLowerCase()) ||
        (cliente.cpf_cnpj && cliente.cpf_cnpj.includes(busca));
      const correspondeModalidade = modalidadeFiltro === 'TODAS' || cliente.modalidade === modalidadeFiltro;
      return correspondeBusca && correspondeModalidade;
    });
  }, [clientes, busca, modalidadeFiltro]);


const contagemStatus = useMemo(() => ({
  ativos:   clientes.filter(c => c.status === 'ativo').length,
  negativos: clientes.filter(c => c.status === 'negativo').length,
}), [clientes]);

  const formatarMoeda = (valor: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

  // NOVO: formatador curto para o eixo Y do gráfico
  const formatarMoedaCurta = (valor: number) => {
    if (valor >= 1000000) return `R$ ${(valor / 1000000).toFixed(1)}M`;
    if (valor >= 1000) return `R$ ${(valor / 1000).toFixed(0)}k`;
    return `R$ ${valor}`;
  };

  const ciclarStatus = async (id: number, statusAtual: string) => {
  const ciclo: Record<string, string> = {
    'ativo': 'inativo',
    'inativo': 'negativo',
    'negativo': 'ativo',
  };
  const novoStatus = ciclo[statusAtual] ?? 'ativo';
  setProcessandoId(id);
  try {
    await ClienteService.atualizarStatus(id, novoStatus);
    setClientes(prev =>
      prev.map(c => c.id === id ? { ...c, status: novoStatus } : c)
    );
    toast.success(`Status atualizado para ${novoStatus}`);
  } catch (error) {
    console.error("Erro ao mudar status:", error);
    toast.error("Não foi possível atualizar o status.");
  } finally {
    setProcessandoId(null);
  }
};

// Config visual para cada status:
const statusConfig: Record<string, { label: string; classes: string; icon: React.ReactNode }> = {
  ativo:     { label: 'ativo',     classes: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20', icon: <CheckCircle2 size={12} /> },
  inativo:   { label: 'inativo',   classes: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700',      icon: <XCircle size={12} /> },
  negativo:  { label: 'negativo',  classes: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20',          icon: <AlertCircle size={12} /> },
};

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [clientesRes, resumoRes, evolucaoRes] = await Promise.all([
        ClienteService.listar(),
        DashboardService.resumoGeral(),
        DashboardService.evolucaoMensal() // NOVO
      ]);

      const listaOrdenada = clientesRes.data.sort((a: any, b: any) => {
        // Criamos pesos: Ativo é o menor número (vai pro topo), 
        const pesos: Record<string, number> = {
          'ativo': 1,
          'negativo': 2,
          'inativo': 3
        };

        const pesoA = pesos[a.status] ?? 99;
        const pesoB = pesos[b.status] ?? 99;

        if (pesoA !== pesoB) {
          return pesoA - pesoB;
        }
        
        return a.nome.localeCompare(b.nome);
      });

      setClientes(listaOrdenada);
      setResumo(resumoRes.data);
      setEvolucao(evolucaoRes.data); // NOVO
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatarcpfCnpj = (valor: string | null) => {
    if (!valor) return "";
    const raw = valor.replace(/\D/g, '');
    if (raw.length <= 11) {
      return raw.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return raw.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2').substring(0, 18);
  };

const FormatPhone = (value: number | string | null) => {
  if (!value) return "";
  let raw = value.toString().replace(/\D/g, '');
  if (raw.length === 10 || raw.length === 11) {
    raw = "55" + raw;
  }
  if (raw.length === 12) {
    return raw.replace(/^(\d{2})(\d{2})(\d{4})(\d{4})/, '+$1 $2 $3-$4');
  } 
  if (raw.length >= 13) {
    return raw.replace(/^(\d{2})(\d{2})(\d{5})(\d{4}).*/, '+$1 $2 $3-$4').substring(0, 17);
  }
  return raw;
};


useEffect(() => { carregarDados(); }, []);
useEffect(() => { localStorage.setItem('filtro_busca', busca); }, [busca]);
useEffect(() => { localStorage.setItem('filtro_modalidade', modalidadeFiltro); }, [modalidadeFiltro]);

 
const dadosGrafico = useMemo(() => {
    return evolucao.map((item) => ({
      mes: item.mes,

      Montante: Number(item.montante_mensal) || 0,
      Spread: Number(item.spread_realizado) || 0,
      Inadimplência: Number(item.inadimplencia_mensal) || 0,
    }));
  }, [evolucao]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <div className="max-w-[1400px] mx-auto px-4 py-8">

        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Metropolitan <span className="text-indigo-600 dark:text-indigo-400">Cobranças</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">Visão geral da sua carteira de recebíveis.</p>
          </div>
          <button
            onClick={() => navigate('/clientes/novo')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-all"
          >
            <Plus size={18} /> Novo Cliente
          </button>
          <button
            onClick={() => navigate('/baixa-repasse')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-all"
          >
            <Plus size={18} /> Dar Baixa
          </button>
        </header>

        {/* DASHBOARD CARDS */}
        {resumo && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm transition-colors">
              
           
  <div className="flex justify-between mb-4">
    <Users size={20} className="text-indigo-600 dark:text-indigo-400" />
    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">GERAL</span>
  </div>
  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Clientes</p>
  <div className="flex items-end gap-4">
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-0.5">Ativos</p>
      <h3 className="text-3xl font-bold dark:text-white">{contagemStatus.ativos}</h3>
    </div>
    <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mb-1" />
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500 mb-0.5">Negativos</p>
      <h3 className="text-3xl font-bold text-rose-600 dark:text-rose-400">{contagemStatus.negativos}</h3>
    </div>
  </div>
</div>
           

            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm transition-colors">
              <div className="flex justify-between mb-4">
                <Wallet size={20} className="text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">CARTEIRA</span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Montante Total</p>
              <h3 className="text-3xl font-bold dark:text-white">{formatarMoeda(resumo.carteira.montante_total_recebido)}</h3>
            </div>

            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm transition-colors">
              <div className="flex justify-between mb-4">
                <TrendingUp size={20} className="text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">SPREAD</span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Spread Total da Carteira</p>
              <h3 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{formatarMoeda(resumo.carteira.spread_total_carteira)}</h3>
            </div>

            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm transition-colors">
              <div className="flex justify-between mb-4">
                <AlertCircle size={20} className="text-rose-600 dark:text-rose-400" />
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400">RISCO</span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Inadimplência Total</p>
              <h3 className="text-3xl font-bold text-rose-600 dark:text-rose-400">{formatarMoeda(resumo.inadimplencia.total_em_atraso)}</h3>
            </div>
          </div>
        )}

        {/* GRÁFICO DE EVOLUÇÃO MENSAL */}
        {dadosGrafico.length > 0 && (
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm p-6 mb-10 transition-colors">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Evolução Mensal</h2>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dadosGrafico} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" vertical={false} />
                  <XAxis 
                    dataKey="mes" 
                    tick={{ fontSize: 12, fill: '#94a3b8' }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tickFormatter={formatarMoedaCurta} 
                    tick={{ fontSize: 11, fill: '#94a3b8' }} 
                    width={80} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                  
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      fontSize: '13px' 
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '16px' }} />
                  <Line 
                    type="monotone" 
                    dataKey="Montante" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#10b981' }} 
                    activeDot={{ r: 6 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Spread" 
                    stroke="#6366f1" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#6366f1' }} 
                    activeDot={{ r: 6 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Inadimplência" 
                    stroke="#f43f5e" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#f43f5e' }} 
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
          </div>
        )}
       
        {/* TABELA DE CLIENTES */}
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm overflow-hidden transition-colors">
          {/* Toolbar Atualizada */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-700/50 flex flex-col lg:flex-row justify-between items-center gap-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Listagem de Clientes</h2>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              {/* Filtro por Modalidade */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select 
                  value={modalidadeFiltro}
                  onChange={(e) => setModalidadeFiltro(e.target.value)}
                  className="pl-10 pr-8 py-2 bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none text-slate-600 dark:text-slate-300 font-medium outline-none"
                >
                  {modalidadesDisponiveis.map(mod => (
                    <option key={mod} value={mod}>{mod}</option>
                  ))}
                </select>
              </div>

              {/* Busca por Texto */}
              <div className="relative w-full sm:w-80 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar por nome ou documento..." 
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400 dark:text-white outline-none"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="mt-4 text-sm font-medium text-slate-400 italic">Sincronizando dados...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-700/50">
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Cliente</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Documento</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Modalidade</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Status</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {clientesFiltrados.map((cliente) => (
                    <tr key={cliente.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-all group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{cliente.nome}</span>
                          <span className="text-xs text-slate-400 dark:text-slate-500">{FormatPhone(cliente.telefone)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-medium">
                        {formatarcpfCnpj(cliente.cpf_cnpj)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 uppercase">
                          {cliente.modalidade}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                            {(() => {
                              const cfg = statusConfig[cliente.status] ?? statusConfig['inativo'];
                              return (
                                <button
                                  onClick={() => ciclarStatus(cliente.id, cliente.status)}
                                  disabled={processandoId === cliente.id}
                                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${cfg.classes}`}
                                >
                                  {processandoId === cliente.id
                                    ? <Loader2 size={12} className="animate-spin" />
                                    : cfg.icon}
                                  {cfg.label}
                                </button>
                              );
                            })()}
                          </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => navigate(`/clientes/${cliente.id}`)} className="p-2 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-600 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all">
                          <ChevronRight size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {clientesFiltrados.length === 0 && (
                <div className="py-20 text-center">
                   <p className="text-slate-500 text-sm font-medium">Nenhum cliente encontrado com os filtros aplicados.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};