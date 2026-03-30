// components/ParcelaEditModal.tsx
import React, { useState } from 'react';
import { X, Save, Loader2, RotateCcw, AlertTriangle } from 'lucide-react';
import { ParcelaService } from '../api/api'; // ajuste o import conforme seu projeto

type Parcela = {
  id: number;
  status: string;
  valor: number;
  valor_pago?: number | null;
  data_vencimento: string;
  data_pagamento?: string | null;
  observacao?: string | null;
  numero_parcela?: number;
  total_parcelas?: number;
  cliente_nome?: string;
};

type Props = {
  parcela: Parcela;
  onClose: () => void;
  onSaved: () => void;
};

const STATUS_OPTIONS = [
  { value: 'pendente',  label: 'Pendente',  color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { value: 'pago',      label: 'Pago',      color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { value: 'atrasado',  label: 'Atrasado',  color: 'text-red-600 bg-red-50 border-red-200' },
  { value: 'cancelado', label: 'Cancelado', color: 'text-slate-500 bg-slate-50 border-slate-200' },
];

function formatCurrency(v?: number | null) {
  if (!v) return '—';
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export const ParcelaEditModal: React.FC<Props> = ({ parcela, onClose, onSaved }) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    status:          parcela.status,
    valor:           parcela.valor?.toString() ?? '',
    valor_pago:      parcela.valor_pago?.toString() ?? '',
    data_pagamento:  parcela.data_pagamento ?? '',
    data_vencimento: parcela.data_vencimento,
    observacao:      parcela.observacao ?? '',
  });

  const statusAtual = STATUS_OPTIONS.find(s => s.value === form.status);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Reverter para pendente com um clique
  const reverterParaPendente = () => {
    setForm(prev => ({
      ...prev,
      status:         'pendente',
      valor_pago:     '',
      data_pagamento: '',
      observacao:     prev.observacao,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: Record<string, any> = {
        status: form.status,
        data_vencimento: form.data_vencimento || undefined,
        observacao: form.observacao || undefined,
      };

      if (form.valor)        payload.valor        = parseFloat(form.valor);
      if (form.valor_pago)   payload.valor_pago   = parseFloat(form.valor_pago);
      if (form.data_pagamento) payload.data_pagamento = form.data_pagamento;

      // Se reverteu para pendente, limpa os campos de pagamento explicitamente
      if (form.status !== 'pago') {
        payload.valor_pago     = null;
        payload.data_pagamento = null;
      }

      await ParcelaService.atualizar(parcela.id, payload);
      onSaved();
      onClose();
    } catch (err: any) {
      alert('Erro ao salvar: ' + (err.response?.data?.detail || 'Tente novamente.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/60">
          <div>
            <h2 className="text-lg font-black text-slate-900">Editar Parcela</h2>
            {parcela.cliente_nome && (
              <p className="text-sm text-slate-500 font-medium mt-0.5">{parcela.cliente_nome}</p>
            )}
            {parcela.numero_parcela && (
              <p className="text-xs text-slate-400 mt-0.5">
                Parcela {parcela.numero_parcela} de {parcela.total_parcelas}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Aviso de reversão rápida */}
        {parcela.status === 'pago' && (
          <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-amber-700 text-xs font-medium">
              <AlertTriangle size={15} className="text-amber-500 shrink-0" />
              Parcela marcada como paga. Deseja reverter?
            </div>
            <button
              type="button"
              onClick={reverterParaPendente}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition-all shrink-0"
            >
              <RotateCcw size={13} />
              Reverter
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Status */}
          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
              Status
            </label>
            <div className="grid grid-cols-4 gap-2">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, status: opt.value }))}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all
                    ${form.status === opt.value
                      ? opt.color + ' ring-2 ring-offset-1 ring-current'
                      : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Valor e Valor Pago */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                Valor da Parcela
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                <input
                  type="number" name="valor" step="0.01"
                  value={form.valor} onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-2xl outline-none font-medium focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                Valor Pago
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                <input
                  type="number" name="valor_pago" step="0.01"
                  value={form.valor_pago} onChange={handleChange}
                  disabled={form.status !== 'pago'}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-2xl outline-none font-medium focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                Vencimento
              </label>
              <input
                type="date" name="data_vencimento"
                value={form.data_vencimento} onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 rounded-2xl outline-none font-medium focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                Data de Pagamento
              </label>
              <input
                type="date" name="data_pagamento"
                value={form.data_pagamento} onChange={handleChange}
                disabled={form.status !== 'pago'}
                className="w-full px-4 py-3 bg-slate-50 rounded-2xl outline-none font-medium focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Observação */}
          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
              Observação
            </label>
            <textarea
              name="observacao"
              value={form.observacao} onChange={handleChange}
              rows={2}
              placeholder="Ex: Pagamento estornado, erro de lançamento..."
              className="w-full px-4 py-3 bg-slate-50 rounded-2xl outline-none font-medium resize-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Ações */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button" onClick={onClose}
              className="px-6 py-3 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit" disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};