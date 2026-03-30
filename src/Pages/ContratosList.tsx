import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Calendar, 
  DollarSign, 
  Layers, 
  Loader2, 
  Hash, 
  User as UserIcon,
  Search
} from 'lucide-react';
import { ContratoService } from '../api/api';

interface Contrato {
  id: number;
  cliente_id: number;
  valor_enviado: number;
  montante: number;
  num_parcelas: number;
  valor_parcela: number;
  data_inicio: string;
  ativo: boolean;
}

export const ContratosList: React.FC = () => {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filtro, setFiltro] = useState('');

  // 🔥 FUNÇÃO QUE CORRIGE O ERRO DO DIA (IGNORA FUSO HORÁRIO)
  const formatarDataLiteral = (dataString: string) => {
    if (!dataString) return '--/--/----';
    const partes = dataString.split('T')[0].split('-');
    if (partes.length !== 3) return dataString;
    const [ano, mes, dia] = partes;
    return `${dia}/${mes}/${ano}`;
  };

  const formatarMoeda = (valor: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

  useEffect(() => {
    const carregarContratos = async () => {
      try {
        const response = await ContratoService.listar(true);
        setContratos(response.data);
      } catch (error) {
        console.error("Erro ao buscar contratos:", error);
      } finally {
        setLoading(false);
      }
    };
    carregarContratos();
  }, []);

  // Filtro simples por ID ou ID do Cliente
  const contratosFiltrados = contratos.filter(c => 
    c.id.toString().includes(filtro) || c.cliente_id.toString().includes(filtro)
  );

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="mt-4 text-slate-500 font-medium">Buscando registros...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans">
      <div className="max-w-[1400px] mx-auto">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Gestão de <span className="text-indigo-600">Contratos</span>
            </h1>
            <p className="text-slate-500 font-medium mt-1">Acompanhamento de desembolsos e montantes.</p>
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Filtrar por ID..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>
        </header>

        {/* TABELA DE CONTRATOS */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center"><Hash size={14} className="inline mr-1"/> ID</th>
                  <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center"><UserIcon size={14} className="inline mr-1"/> Cliente</th>
                  <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest"><DollarSign size={14} className="inline mr-1"/> Desembolso</th>
                  <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Montante Total</th>
                  <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center"><Layers size={14} className="inline mr-1"/> Parcelas</th>
                  <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center"><Calendar size={14} className="inline mr-1"/> Início</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contratosFiltrados.map((contrato) => (
                  <tr key={contrato.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6 text-center">
                      <span className="text-sm font-bold text-slate-400">#{contrato.id}</span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold border border-indigo-100">
                        Cód. {contrato.cliente_id}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-700">{formatarMoeda(contrato.valor_enviado)}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Valor Líquido</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-emerald-600">{formatarMoeda(contrato.montante)}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Valor Final</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-slate-700">{contrato.num_parcelas}x</span>
                        <span className="text-[10px] text-indigo-400 font-bold uppercase">{formatarMoeda(contrato.valor_parcela)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className="text-xs font-bold text-slate-500">
                        {formatarDataLiteral(contrato.data_inicio)}
                      </span>
                    </td>
                  </tr>
                ))}
                
                {contratosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <FileText size={48} className="mb-4 opacity-20" />
                        <p className="font-medium italic text-sm">Nenhum contrato ativo encontrado.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};