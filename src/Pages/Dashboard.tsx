import React, { useEffect, useState } from 'react';
import { DashboardService } from '../api/api';
import { TrendingUp, AlertCircle, Wallet, Calendar, Loader2 } from 'lucide-react';



export const DashboardEvolucaoCompleta: React.FC = () => {
  const [dadosMensais, setDadosMensais] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
const formtarData = (data: string) => {
    const [ano, mes] = data.split('-');
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${meses[Number(mes) - 1]} / ${ano}`;
  };
  const formatarMoeda = (valor: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

  useEffect(() => {
    const carregarTudo = async () => {
      try {
        const res = await DashboardService.evolucaoMensal();
        setDadosMensais(res.data);
      } catch (e) {
        console.error("Erro ao carregar evolução:", e);
      } finally {
        setLoading(false);
      }
    };
    carregarTudo();
  }, []);

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  return (
    <div className="p-8 bg-[#F8FAFC] dark:bg-[#0B0F19] min-h-screen transition-colors duration-200">
      <h1 className="text-2xl font-black mb-8 text-slate-900 dark:text-white">Evolução de Carteira <span className="text-indigo-600 dark:text-indigo-400">Total</span></h1>

      <div className="bg-white dark:bg-slate-800/50 rounded-[2rem] border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden transition-colors">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/30">
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Mês Referência</th>

               <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <div className="flex items-center gap-1"><Wallet size={12}/> Valor Enviado</div>
              </th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <div className="flex items-center gap-1"><Wallet size={12}/> Montante Previsto</div>
              </th>
              <th className="px-8 py-5 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                <div className="flex items-center gap-1"><TrendingUp size={12}/> Spread (Lucro)</div>
              </th>
              <th className="px-8 py-5 text-[10px] font-black text-rose-400 uppercase tracking-widest">
                <div className="flex items-center gap-1"><AlertCircle size={12}/> Inadimplência</div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {dadosMensais.map((item, index) => (
              <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
                <td className="px-8 py-5 font-bold text-slate-700 dark:text-slate-300">{formtarData(item.mes)}</td>
                 <td className="px-8 py-5 font-bold text-slate-900 dark:text-white">{formatarMoeda(item.valor_enviado_mensal)}</td>
                <td className="px-8 py-5 font-bold text-slate-900 dark:text-white">{formatarMoeda(item.montante_mensal)}</td>

              
                <td className="px-8 py-5 font-black text-indigo-600">{formatarMoeda(item.spread_mensal)}</td>
                <td className="px-8 py-5 font-black text-rose-500">
                   {item.inadimplencia_mensal > 0 ? formatarMoeda(item.inadimplencia_mensal) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};