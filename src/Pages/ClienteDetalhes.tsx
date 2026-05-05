import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClienteService, ParcelaService } from '../api/api';
import { Pencil } from 'lucide-react';
import { ParcelaEditModal } from './EditarParcela'; // ajuste o caminho
import { toast } from 'sonner';

export const ClienteDetalhes: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [cliente, setCliente] = useState<any>(null);
  const [contratos, setContratos] = useState<any[]>([]);
  const [parcelas, setParcelas] = useState<any[]>([]);
  
  // Estados do Modal de Pagamento
  const [modalAberto, setModalAberto] = useState(false);
  const [parcelaSelecionada, setParcelaSelecionada] = useState<any>(null);
  const [valorPago, setValorPago] = useState<number | ''>('');
  const [dataPagamento, setDataPagamento] = useState<string>(new Date().toISOString().split('T')[0]);
  const [observacao, setObservacao] = useState<string>('');

  // ← NOVO: estado do modal de edição
  const [parcelaEditando, setParcelaEditando] = useState<any>(null);

  const hoje = new Date().toISOString().split('T')[0];

  const carregarDados = async () => {
    if (!id) return;
    try {
      const [cliRes, contRes, parcRes] = await Promise.all([
        ClienteService.buscarPorId(Number(id)),
        ClienteService.buscarContratos(Number(id)),
        ClienteService.buscarParcelas(Number(id))
      ]);
      setCliente(cliRes.data);
      setContratos(contRes.data);
      setParcelas(parcRes.data);
    } catch (error) {
      console.error("Erro ao carregar detalhes:", error);
    }
  };

  useEffect(() => { carregarDados(); }, [id]);

  const handleDeleteCliente = async (id: number, nome: string) => {
    const confirmacao = window.confirm(
      `ATENÇÃO: Você deseja excluir permanentemente o cliente ${nome}?\n\n` +
      `Isso apagará todos os CONTRATOS e PARCELAS vinculados a ele no banco de dados da Metropolitan.`
    );
    if (confirmacao) {
      try {
        await ClienteService.excluir(id);
        toast.success("Cliente e todos os registros vinculados foram apagados.");
        navigate('/');
      } catch (error: any) {
        console.error("Erro ao excluir:", error);
        toast.error("Erro ao excluir do banco de dados.");
      }
    }
  };

  const abrirModalPagamento = (parcela: any) => {
    setParcelaSelecionada(parcela);
    setValorPago(parcela.valor);
    setDataPagamento(new Date().toISOString().split('T')[0]);
    setObservacao('');
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setParcelaSelecionada(null);
  };

  const confirmarPagamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parcelaSelecionada) return;
    try {
      await ParcelaService.pagar(parcelaSelecionada.id, {
        valor_pago: Number(valorPago),
        data_pagamento: dataPagamento,
        observacao: observacao
      });
      toast.success('Pagamento registrado com sucesso!');
      fecharModal();
      carregarDados();
    } catch (error) {
      console.error("Erro ao registrar pagamento:", error);
      toast.error('Erro ao processar o pagamento.');
    }
  };
  
  const formatarDataSemFuso = (dataString: string) => {
    if (!dataString) return '--/--/----';
    try {
      const partes = dataString.split('T')[0].split('-');
      if (partes.length !== 3) return '--/--/----';
      const [ano, mes, dia] = partes;
      return `${dia}/${mes}/${ano}`;
    } catch (e) {
      return '--/--/----';
    }
  };

  const formatarMoeda = (valor: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  if (!cliente) return <div className="p-8 text-center">Carregando informações da Metropolitan...</div>;

  const parcelasPagas = parcelas.filter(p => p.status === 'pago').length;
  const valorTotalAtrasado = parcelas
    .filter(p => p.status !== 'pago' && p.data_vencimento < hoje)
    .reduce((acc, p) => acc + Number(p.valor), 0);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 font-sans relative">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => navigate(-1)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center gap-1 transition-colors">
          &larr; Voltar
        </button>
        <button 
          onClick={() => navigate(`/clientes/editar/${cliente.id}`)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
        >
          Editar Cliente
        </button>
        <button 
          onClick={() => handleDeleteCliente(cliente.id, cliente.nome)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
        >
          Excluir
        </button>
      </div>

      {/* Card Resumo */}
      <div className="bg-white dark:bg-slate-800/50 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700/50 p-6 transition-colors">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{cliente.nome}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">CPF: {cliente.cpf_cnpj} | Tel: {cliente.telefone}</p>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4 border-gray-100 dark:border-slate-700/50">
          <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-lg">
            <span className="text-sm text-gray-500 dark:text-gray-400 block">Empréstimos Ativos</span>
            <span className="text-xl font-bold text-gray-800 dark:text-white">{contratos.length}</span>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800/50">
            <span className="text-sm text-blue-500 dark:text-blue-400 block">Progresso (Pagas)</span>
            <span className="text-xl font-bold text-blue-800 dark:text-blue-300">{parcelasPagas} de {parcelas.length}</span>
          </div>
          <div className={`p-4 rounded-lg border ${valorTotalAtrasado > 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
            <span className={`text-sm block ${valorTotalAtrasado > 0 ? 'text-red-500' : 'text-green-500'}`}>Total em Atraso</span>
            <span className={`text-xl font-bold ${valorTotalAtrasado > 0 ? 'text-red-800' : 'text-green-800'}`}>
              {formatarMoeda(valorTotalAtrasado)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => navigate(`/contrato/${cliente.id}`)}
          className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
        >
          Editar Contratos
        </button>
      </div>

      {/* Tabela de Parcelas */}
      <div className="bg-white dark:bg-slate-800/50 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700/50 overflow-hidden transition-colors">
        <table className="w-full text-left text-sm text-gray-600 dark:text-slate-300">
          <thead className="bg-gray-50 dark:bg-slate-900/50 text-gray-700 dark:text-slate-400 uppercase font-semibold border-b border-gray-200 dark:border-slate-700/50">
            <tr>
              <th className="px-6 py-3">Contrato / Parcela</th>
              <th className="px-6 py-3">Vencimento</th>
              <th className="px-6 py-3">Valor</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
            {parcelas.map((p) => {
              const dataVenc = p.data_vencimento?.split('T')[0] ?? '';
              const estaVencida = p.status !== 'pago' && dataVenc < hoje;
              const statusFinal = estaVencida ? 'atrasado' : p.status;

              return (
                <tr key={p.id} className={`hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors ${estaVencida ? 'bg-red-50/40 dark:bg-red-900/10' : ''}`}>
                  <td className="px-6 py-4 dark:text-white">#{p.contrato_id} - Parcela {p.numero_parcela}/{p.total_parcelas}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className={`font-medium ${estaVencida ? 'text-red-600' : 'text-gray-700'}`}>
                        {formatarDataSemFuso(p.data_vencimento)}
                      </span>
                      <span className="text-[10px] text-indigo-500 font-bold">REF: {p.mes_referencia}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-800">{formatarMoeda(p.valor)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider
                      ${statusFinal === 'pago' ? 'bg-green-100 text-green-700' : 
                        statusFinal === 'atrasado' ? 'bg-red-600 text-white animate-pulse' : 
                        'bg-yellow-100 text-yellow-700'}`}
                    >
                      {statusFinal}
                    </span>
                  </td>

                  {/* ── AÇÕES ── */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">

                      {/* Botão Editar — sempre visível */}
                      <button
                        onClick={() => setParcelaEditando({ ...p, cliente_nome: cliente.nome })}
                        className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                        title="Editar parcela"
                      >
                        <Pencil size={15} />
                      </button>

                      {/* Botão Pagar — só para não pagas */}
                      {p.status !== 'pago' ? (
                        <button 
                          onClick={() => abrirModalPagamento(p)}
                          className={`px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-all
                            ${estaVencida ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                        >
                          {estaVencida ? 'COBRAR / PAGAR' : 'BAIXA MANUAL'}
                        </button>
                      ) : (
                        <div className="flex flex-col items-end">
                          <span className="text-green-600 text-xs font-bold">PAGO</span>
                          <span className="text-[10px] text-gray-400">{formatarMoeda(p.valor_pago || p.valor)}</span>
                        </div>
                      )}

                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL DE PAGAMENTO */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 relative border border-gray-200 dark:border-slate-700 transition-colors">
            <button onClick={fecharModal} className="absolute top-4 right-4 text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 text-xl">
              &times;
            </button>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Registrar Recebimento</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
              Contrato #{parcelaSelecionada?.contrato_id} - Parcela {parcelaSelecionada?.numero_parcela}
            </p>
            <form onSubmit={confirmarPagamento} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Valor Recebido (R$)</label>
                <input 
                  type="number" step="0.01" required
                  value={valorPago} onChange={e => setValorPago(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Data do Recebimento</label>
                <input 
                  type="date" required
                  value={dataPagamento} onChange={e => setDataPagamento(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Observações / Meio de Pgto</label>
                <textarea 
                  value={observacao} onChange={e => setObservacao(e.target.value)} rows={2}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                  placeholder="Ex: Recebido via PIX, desconto de juros..."
                />
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={fecharModal} className="px-5 py-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-colors">
                  Confirmar Baixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL DE EDIÇÃO DE PARCELA ── */}
      {parcelaEditando && (
        <ParcelaEditModal
          parcela={parcelaEditando}
          onClose={() => setParcelaEditando(null)}
          onSaved={() => {
            setParcelaEditando(null);
            carregarDados();
          }}
        />
      )}
    </div>
  );
};