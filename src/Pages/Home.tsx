import React, { useEffect, useState, useMemo } from 'react'; // Adicionado useMemo
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Wallet, 
  AlertCircle, 
  TrendingUp,
  Plus, 
  Search, 
  ChevronRight,
  Filter // Ícone novo
} from 'lucide-react';
import { ClienteService, DashboardService } from '../api/api';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export const PaginaPrincipal: React.FC = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<any[]>([]);
  const [resumo, setResumo] = useState<any>(null);
  const [busca, setBusca] = useState<string>(() => 
    localStorage.getItem('filtro_busca') || ''
  );

  const [modalidadeFiltro, setModalidadeFiltro] = useState<string>(() => 
    localStorage.getItem('filtro_modalidade') || 'TODAS'
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [processandoId, setProcessandoId] = useState<number | null>(null);



  // Extrair modalidades únicas para o select
  const modalidadesDisponiveis = useMemo(() => {
    const mods = clientes.map(c => c.modalidade).filter(Boolean);
    return ['TODAS', ...Array.from(new Set(mods))];
  }, [clientes]);

  // Lógica de filtragem combinada
  const clientesFiltrados = useMemo(() => {
    return clientes.filter(cliente => {
     const correspondeBusca =
          cliente.nome.toLowerCase().includes(busca.toLowerCase()) ||
          (cliente.cpf_cnpj && cliente.cpf_cnpj.includes(busca));

      const correspondeModalidade = modalidadeFiltro === 'TODAS' || cliente.modalidade === modalidadeFiltro;
      
      return correspondeBusca && correspondeModalidade;
    });
  }, [clientes, busca, modalidadeFiltro]);

  const formatarMoeda = (valor: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);

  const toggleStatus = async (id: number, statusAtual: boolean) => {
    setProcessandoId(id);
    try {
      await ClienteService.atualizarStatus(id, !statusAtual);
      setClientes(prev =>
        prev.map(c => c.id === id ? { ...c, ativo: !statusAtual } : c)
      );
    } catch (error) {
      console.error("Erro ao mudar status:", error);
      alert("Não foi possível atualizar o status.");
    } finally {
      setProcessandoId(null);
    }
  };

  const carregarDados = async (termoDeBusca: string = '') => {
    setLoading(true);
    try {
      const [clientesRes, resumoRes] = await Promise.all([
        ClienteService.listar(termoDeBusca), 
        DashboardService.resumoGeral()
      ]);

      const listaOrdenada = clientesRes.data.sort((a: any, b: any) => {
        if (a.ativo === b.ativo) return 0;
        return a.ativo ? -1 : 1;
      });

      setClientes(listaOrdenada);
      setResumo(resumoRes.data);
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
  }

  const FormatPhone = (value: number | string | null) => {
    if (!value) return "";
    const raw = value.toString().replace(/\D/g, '');
    if (raw.length <= 10) {
      return raw.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
    }
    return raw.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').substring(0, 15); 
  };
  
  useEffect(() => {
    carregarDados();
  }, []);


  useEffect(() => {
  localStorage.setItem('filtro_busca', busca);
}, [busca]);

useEffect(() => {
  localStorage.setItem('filtro_modalidade', modalidadeFiltro);
}, [modalidadeFiltro]);


  return (
    
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <div className="max-w-[1400px] mx-auto px-4 py-8">

        {/* HEADER */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Metropolitan <span className="text-indigo-600">Cobranças</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1 font-medium">
              Visão geral da sua carteira de recebíveis.
            </p>
          </div>
          <button
            onClick={() => navigate('/clientes/novo')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-all"
          >
            <Plus size={18} />
            Novo Cliente
          </button>
              <button
            onClick={() => navigate('/baixa-repasse')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-all"
          >
            <Plus size={18} />
           Dar Baixa
          </button>
        </header>

        {/* DASHBOARD */}
        {resumo && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">

            {/* Clientes */}
            <div className="bg-white p-6 rounded-2xl border shadow-sm">
              <div className="flex justify-between mb-4">
                <Users size={20} className="text-indigo-600" />
                <span className="text-xs font-bold text-indigo-600">GERAL</span>
              </div>
              <p className="text-sm text-slate-500">Total de Clientes</p>
              <h3 className="text-3xl font-bold">
                {resumo.carteira.total_clientes}
              </h3>
            </div>

            {/* Montante */}
            <div className="bg-white p-6 rounded-2xl border shadow-sm">
              <div className="flex justify-between mb-4">
                <Wallet size={20} className="text-emerald-600" />
                <span className="text-xs font-bold text-emerald-600">CARTEIRA</span>
              </div>
              <p className="text-sm text-slate-500">Montante Total</p>
              <h3 className="text-3xl font-bold">
                {formatarMoeda(resumo.carteira.montante_total_carteira)}
              </h3>
            </div>

            {/* Spread Total */}
            <div className="bg-white p-6 rounded-2xl border shadow-sm">
              <div className="flex justify-between mb-4">
                <TrendingUp size={20} className="text-indigo-600" />
                <span className="text-xs font-bold text-indigo-600">SPREAD</span>
              </div>
              <p className="text-sm text-slate-500">Spread Total da Carteira</p>
              <h3 className="text-3xl font-bold text-indigo-600">
                {formatarMoeda(resumo.carteira.spread_total_carteira)}
              </h3>
            </div>

            {/* Inadimplência */}
            <div className="bg-white p-6 rounded-2xl border shadow-sm">
              <div className="flex justify-between mb-4">
                <AlertCircle size={20} className="text-rose-600" />
                <span className="text-xs font-bold text-rose-600">RISCO</span>
              </div>
              <p className="text-sm text-slate-500">Inadimplência Total</p>
              <h3 className="text-3xl font-bold text-rose-600">
                {formatarMoeda(resumo.inadimplencia.total_em_atraso)}
              </h3>
            </div>

          </div>
        )}

       
        {/* TABELA DE CLIENTES */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          {/* Toolbar Atualizada */}
          <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-4 bg-white">
            <h2 className="text-lg font-bold text-slate-800">Listagem de Clientes</h2>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              {/* Filtro por Modalidade */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select 
                  value={modalidadeFiltro}
                  onChange={(e) => setModalidadeFiltro(e.target.value)}
                  className="pl-10 pr-8 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none text-slate-600 font-medium"
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
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center bg-white">
              <div className="w-8 h-8 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="mt-4 text-sm font-medium text-slate-400 italic">Sincronizando dados...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Cliente</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Documento</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Modalidade</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Renderizar clientesFiltrados em vez de clientes */}
                  {clientesFiltrados.map((cliente) => (
                    <tr key={cliente.id} className="hover:bg-slate-50/80 transition-all group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">{cliente.nome}</span>
                          <span className="text-xs text-slate-400">{FormatPhone(cliente.telefone)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                        {formatarcpfCnpj(cliente.cpf_cnpj)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                          {cliente.modalidade}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => toggleStatus(cliente.id, cliente.ativo)}
                          disabled={processandoId === cliente.id}
                          className={`relative inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold transition-all ${cliente.ativo ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}
                        >
                          {processandoId === cliente.id ? <Loader2 size={12} className="animate-spin" /> : (cliente.ativo ? <CheckCircle2 size={12} /> : <XCircle size={12} />)}
                          {cliente.ativo ? 'ATIVO' : 'INATIVO'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => navigate(`/clientes/${cliente.id}`)} className="p-2 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 transition-all">
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