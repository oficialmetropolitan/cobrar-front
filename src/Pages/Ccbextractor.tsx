import React, { useState, useCallback } from 'react';
import { Upload, CheckCircle2, AlertCircle, FileText, X, Sparkles } from 'lucide-react';
import { CCBService } from '../api/api';

export type CCBExtractedData = {
  nome: string;
  cpf_cnpj: string;
  telefone: string;
  email: string;
  valor_enviado: number;
  montante: number;
  taxa_mensal: number;
  num_parcelas: number;
  dia_vencimento: number;
  data_inicio: string;
  modalidade: string;
  spread_total: number;
  parcelas: { numero: number; vencimento: string; total: string }[];
};

type Status = 'idle' | 'uploading' | 'success' | 'error';

type Props = {
  onDataExtracted: (data: CCBExtractedData) => void;
  mode?: 'cliente' | 'contrato'; // ← novo
};

export const CCBExtractor: React.FC<Props> = ({ onDataExtracted, mode = 'contrato' }) => {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [extracted, setExtracted] = useState<CCBExtractedData | null>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
      setStatus('error');
      setErrorMsg('Selecione um arquivo PDF válido.');
      return;
    }
    setFileName(file.name);
    setExtracted(null);
    setErrorMsg('');
    setStatus('uploading');

    try {
      const response = await CCBService.extrairDados(file);
      const data: CCBExtractedData = response.data;
      setExtracted(data);
      setStatus('success');
    } catch (e: any) {
      setStatus('error');
      setErrorMsg(e.message || 'Erro desconhecido.');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  }, [processFile]);

  const reset = () => {
    setStatus('idle');
    setExtracted(null);
    setFileName('');
    setErrorMsg('');
  };

  const fmt = (v: number) =>
    typeof v === 'number'
      ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : '—';

  // ── Campos do preview filtrados por mode ──────────────────────────────────
  const previewFields = (data: CCBExtractedData) => {
    const clienteFields = [
      { label: 'Nome',         value: data.nome,       full: true },
      { label: 'CPF/CNPJ',    value: data.cpf_cnpj },
      { label: 'Telefone',    value: data.telefone },
      { label: 'E-mail',      value: data.email,       full: true },
      { label: 'Modalidade',  value: data.modalidade },
      { label: 'Vencimento',  value: data.dia_vencimento ? `Dia ${data.dia_vencimento}` : '—' },
    ];

    const contratoFields = [
      ...clienteFields,
      { label: 'Valor enviado', value: fmt(data.valor_enviado) },
      { label: 'Montante',      value: fmt(data.montante) },
      { label: 'Taxa mensal',   value: `${data.taxa_mensal}%` },
      { label: 'Parcelas',      value: `${data.num_parcelas}x` },
      { label: 'Spread total',  value: fmt(data.spread_total) },
    ];

    return mode === 'cliente' ? clienteFields : contratoFields;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
        <div className="p-2 bg-white rounded-xl shadow-sm text-violet-600">
          <FileText size={20} />
        </div>
        <div>
          <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest">
            Importar CCB (PDF)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">
            {mode === 'cliente'
              ? 'Preenche apenas os dados do cliente'
              : 'Envie o contrato e preencha o formulário automaticamente'}
          </p>
        </div>
        {status !== 'idle' && (
          <button onClick={reset} className="ml-auto p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="p-6">

        {status === 'idle' && (
          <label
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            className={`flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all
              ${isDragging ? 'border-violet-400 bg-violet-50' : 'border-slate-200 hover:border-violet-300 hover:bg-slate-50'}`}
          >
            <input type="file" accept=".pdf" className="hidden"
              onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />
            <div className="p-3 bg-slate-100 rounded-xl">
              <Upload size={22} className="text-slate-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-700">Arraste o PDF da CCB aqui</p>
              <p className="text-xs text-slate-400 mt-1">ou clique para selecionar o arquivo</p>
            </div>
          </label>
        )}

        {status === 'uploading' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-12 h-12 rounded-full border-4 border-violet-100 border-t-violet-500 animate-spin" />
            <div className="text-center">
              <p className="text-sm font-bold text-slate-700">Analisando contrato com IA...</p>
              <p className="text-xs text-slate-400 mt-1">{fileName}</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-start gap-3 p-4 bg-red-50 rounded-2xl border border-red-100">
            <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-700">Erro ao processar o PDF</p>
              <p className="text-xs text-red-500 mt-1">{errorMsg}</p>
              <button onClick={reset} className="mt-2 text-xs font-bold text-red-600 hover:text-red-800 underline">
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        {status === 'success' && extracted && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-emerald-700 uppercase tracking-wider">Dados extraídos com sucesso</p>
                <p className="text-xs text-emerald-600 mt-0.5 truncate">{fileName}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {previewFields(extracted).map((item) => (
                <div key={item.label} className={`bg-slate-50 rounded-xl p-3 ${'full' in item && item.full ? 'col-span-2' : ''}`}>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{item.label}</p>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5 truncate">{item.value || '—'}</p>
                </div>
              ))}
            </div>

            {/* Tabela de parcelas só no mode contrato */}
            {mode === 'contrato' && extracted.parcelas?.length > 0 && (
              <div className="bg-slate-50 rounded-xl overflow-hidden">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-3 pt-3 pb-2">Parcelas</p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left px-3 py-1.5 text-slate-400 font-semibold">#</th>
                      <th className="text-left px-3 py-1.5 text-slate-400 font-semibold">Vencimento</th>
                      <th className="text-right px-3 py-1.5 text-slate-400 font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extracted.parcelas.map((p) => (
                      <tr key={p.numero} className="border-b border-slate-100 last:border-0">
                        <td className="px-3 py-1.5 text-slate-600">{p.numero}</td>
                        <td className="px-3 py-1.5 text-slate-600">{p.vencimento}</td>
                        <td className="px-3 py-1.5 text-slate-700 font-semibold text-right">R$ {p.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button onClick={reset} className="flex-1 py-3 text-slate-500 font-bold text-sm hover:text-slate-700 transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => onDataExtracted(extracted)}
                className="flex-1 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-violet-600 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Sparkles size={16} />
                Preencher formulário
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};