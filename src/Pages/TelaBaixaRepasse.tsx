import React, { useState, useEffect } from 'react';
import { ParcelaService } from '../api/api';
import { CheckCircle, Clock, Filter, Layers, ListChecks } from 'lucide-react'; // Sugestão: adicione lucide-react para ícones

interface Parcela {
  id: number;
  contrato_id: number;
  numero_parcela: number;
  total_parcelas: number;
  data_vencimento: string;
  valor: number;
  status: 'pendente' | 'atrasado' | 'pago' | 'cancelado';
  cliente_nome?: string;
}

export const BaixaRepasse: React.FC = () => {
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [modalidade, setModalidade] = useState<string>('IPD');
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [mesFiltro, setMesFiltro] = useState<string>('2026-03');
  const [carregando, setCarregando] = useState<boolean>(false);
  const [processando, setProcessando] = useState<boolean>(false);

  const carregarDados = async (mes = mesFiltro, mod = modalidade) => {
    setCarregando(true);
    try {
      const res = await ParcelaService.listar('pendente', mes, mod);
      setParcelas(res.data);
      setSelecionados([]);
    } catch (err) {
      console.error(err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados(mesFiltro, modalidade);
  }, [mesFiltro, modalidade]);

  const toggleSelecao = (id: number) => {
    setSelecionados(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selecionarTodos = () => {
    if (selecionados.length === parcelas.length) {
      setSelecionados([]);
    } else {
      setSelecionados(parcelas.map(p => p.id));
    }
  };

  const executarBaixaEmLote = async () => {
    if (selecionados.length === 0) return;
    const confirmar = window.confirm(`Deseja confirmar o pagamento de ${selecionados.length} parcelas?`);
    if (!confirmar) return;

    setProcessando(true);
    try {
      const res = await ParcelaService.baixar_lote(selecionados); 
      alert(`Sucesso: ${res.data.total_baixado} parcelas processadas!`);
      carregarDados();
    } catch {
      alert('Erro ao processar baixa em lote.');
    } finally {
      setProcessando(false);
    }
  };

  const executarBaixaAutomatica = async () => {
    if (!mesFiltro || !modalidade) return alert('Selecione mês e modalidade');
    const confirmar = window.confirm(`Baixar TODAS as parcelas de ${modalidade} no mês ${mesFiltro}?`);
    if (!confirmar) return;

    setProcessando(true);
    try {
      const res = await ParcelaService.baixar_consignado(mesFiltro, modalidade);
      alert(`Sucesso! ${res.data.total_baixado} parcelas baixadas.`);
      carregarDados();
    } catch (err) {
      alert('Erro na baixa automática');
    } finally {
      setProcessando(false);
    }
  };

  const valorTotalSelecionado = parcelas
    .filter(p => selecionados.includes(p.id))
    .reduce((sum, p) => sum + p.valor, 0);

  // Helper para cores de status
  const getStatusBadge = (status: string) => {
    const styles = {
      pendente: 'bg-amber-100 text-amber-700 border-amber-200',
      pago: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      atrasado: 'bg-rose-100 text-rose-700 border-rose-200',
      cancelado: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    return styles[status as keyof typeof styles] || styles.pendente;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-slate-50 min-h-screen">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* HEADER & FILTERS */}
        <div className="p-6 border-b border-slate-100 bg-white">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Repasse Consignado</h2>
              <p className="text-slate-500 text-sm mt-1">Gestão de baixas manuais e automáticas</p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 ml-1">Mês de Referência</label>
                <input
                  type="month"
                  value={mesFiltro}
                  onChange={(e) => setMesFiltro(e.target.value)}
                  className="border border-slate-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 ml-1">Modalidade</label>
                <select
                  value={modalidade}
                  onChange={(e) => setModalidade(e.target.value)}
                  className="border border-slate-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all min-w-[180px]"
                >
                  <option value="IPD">IPD</option>
                  <option value="HRSM">Hospital Regional</option>
                  <option value="LAB FROTA">Laboratório Frota</option>
                  <option value="clinica_fort">Clínica Fort</option>
                  <option value="D-RADIO">D-Radio</option>
                  <option value="IPECONT">IPECONT</option>
                  <option value="INOVACON">Inovacon</option>
                  <option value="VITRA">Vitra</option>
                  <option value="WIZZER">Wizzer</option>
                  <option value="PJ">PJ</option>
                  <option value="PF">PF</option>
                  <option value="coletek">coletek</option>
                  <option value="MAQUININHA">MAQUININHA</option>
              
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ACTION BAR */}
        <div className="px-6 py-4 bg-slate-50/50 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={executarBaixaEmLote}
              disabled={selecionados.length === 0 || processando}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm shadow-emerald-100"
            >
              <CheckCircle size={18} />
              Baixar Selecionados ({selecionados.length})
            </button>

            <button
              onClick={executarBaixaAutomatica}
              disabled={processando}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm"
            >
              <Layers size={18} className="text-indigo-500" />
              Baixa Automática
            </button>
          </div>

          {selecionados.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-bold shadow-lg shadow-indigo-100 animate-in fade-in zoom-in duration-300">
              Total: R$ {valorTotalSelecionado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          )}
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    onChange={selecionarTodos}
                    checked={selecionados.length === parcelas.length && parcelas.length > 0}
                  />
                </th>
                <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Cliente</th>
                <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Parcela</th>
                <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Vencimento</th>
                <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Valor</th>
                <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {carregando ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400 italic">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      Carregando dados...
                    </div>
                  </td>
                </tr>
              ) : parcelas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400">Nenhuma parcela pendente encontrada.</td>
                </tr>
              ) : (
                parcelas.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        checked={selecionados.includes(p.id)}
                        onChange={() => toggleSelecao(p.id)}
                      />
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-700">{p.cliente_nome || 'N/A'}</div>
                      <div className="text-[10px] text-slate-400 font-mono uppercase">ID CONTRATO: #{p.contrato_id}</div>
                    </td>
                    <td className="p-4 text-sm text-slate-600 font-medium">
                      {p.numero_parcela.toString().padStart(2, '0')}
                      <span className="text-slate-300 mx-1">/</span>
                      {p.total_parcelas.toString().padStart(2, '0')}
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-slate-300" />
                        {new Date(p.data_vencimento).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="p-4 text-sm font-bold text-slate-700">
                      R$ {p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStatusBadge(p.status)}`}>
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400 flex justify-between">
          <span>Mostrando {parcelas.length} registros</span>
          <span>Processamento Seguro &copy; 2026</span>
        </div>
      </div>
    </div>
  );
};