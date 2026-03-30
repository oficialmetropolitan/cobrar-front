import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FileText, ChevronLeft, Save, Loader2, AlertTriangle, Info, User,
} from 'lucide-react';
import { ContratoService, ClienteService } from '../api/api';

type ContratoForm = {
  valor_enviado:      number;
  montante:           number;
  valor_parcela:      number;
  spread_por_parcela: number;
  num_parcelas:       number;
  taxa_mensal:        number;
  data_inicio:        string;
  ativo:              boolean;
};

export const ContratoEdit: React.FC = () => {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(true);
  const [clienteId, setClienteId] = useState<number | null>(null);

  const [form, setForm] = useState<ContratoForm>({
    valor_enviado:      0,
    montante:           0,
    valor_parcela:      0,
    spread_por_parcela: 0,
    num_parcelas:       1,
    taxa_mensal:        0,
    data_inicio:        '',
    ativo:              true,
  });

  // Guarda os valores originais para comparar no submit
  const original = useRef<ContratoForm & { dia_vencimento: number } | null>(null);
  const [diaVencimento, setDiaVencimento] = useState(10);

  // ── Carrega contrato + cliente ─────────────────────────────────
  useEffect(() => {
    const carregar = async () => {
      if (!id) return;
      try {
        setFetching(true);
        const res = await ContratoService.buscarPorId(Number(id));
        const c   = res.data;
        setClienteId(c.cliente_id);

        const cli = await ClienteService.buscarPorId(c.cliente_id);
        const diaVenc = cli.data.dia_vencimento ?? 10;
        setDiaVencimento(diaVenc);

        const valores: ContratoForm = {
          valor_enviado:      Number(c.valor_enviado)      || 0,
          montante:           Number(c.montante)           || 0,
          valor_parcela:      Number(c.valor_parcela)      || 0,
          spread_por_parcela: Number(c.spread_por_parcela) || 0,
          num_parcelas:       Number(c.num_parcelas)       || 1,
          taxa_mensal:        Number(c.taxa_mensal)        || 0,
          data_inicio:        c.data_inicio ?? '',
          ativo:              c.ativo !== false,
        };

        setForm(valores);
        original.current = { ...valores, dia_vencimento: diaVenc };
      } catch (err) {
        console.error('Erro ao carregar contrato:', err);
        alert('Não foi possível carregar o contrato.');
      } finally {
        setFetching(false);
      }
    };
    carregar();
  }, [id]);

  // ── Submit — envia APENAS o que mudou ─────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !original.current) return;
    setLoading(true);

    try {
      const orig = original.current;

      // 1. Atualiza dia_vencimento no cliente só se mudou
      if (clienteId && diaVencimento !== orig.dia_vencimento) {
        await ClienteService.atualizar(clienteId, { dia_vencimento: diaVencimento });
      }

      // 2. Monta payload só com campos que mudaram
      const payload: Record<string, any> = {};

      if (form.valor_enviado      !== orig.valor_enviado)      payload.valor_enviado      = form.valor_enviado;
      if (form.montante           !== orig.montante)           payload.montante           = form.montante;
      if (form.valor_parcela      !== orig.valor_parcela)      payload.valor_parcela      = form.valor_parcela;
      if (form.spread_por_parcela !== orig.spread_por_parcela) payload.spread_por_parcela = form.spread_por_parcela;
      if (form.num_parcelas       !== orig.num_parcelas)       payload.num_parcelas       = form.num_parcelas;
      if (form.taxa_mensal        !== orig.taxa_mensal)        payload.taxa_mensal        = form.taxa_mensal;
      if (form.data_inicio        !== orig.data_inicio)        payload.data_inicio        = form.data_inicio || null;
      if (form.ativo              !== orig.ativo)              payload.ativo              = form.ativo;

      // Se mudou dia_vencimento mas não data_inicio, força data_inicio
      // no payload para o backend saber que precisa regenerar as datas
      if (diaVencimento !== orig.dia_vencimento && payload.data_inicio === undefined) {
        payload.data_inicio = form.data_inicio || null;
      }

      if (Object.keys(payload).length === 0) {
        alert('Nenhuma alteração detectada.');
        setLoading(false);
        return;
      }

      const res  = await ContratoService.atualizar(Number(id), payload);
      const resp = res.data;

      const msg = resp.deve_regenerar
        ? `✓ Contrato atualizado!\n${resp.parcelas_regeneradas} parcela(s) recriada(s).\n${resp.parcelas_pagas_preservadas} paga(s) preservada(s).`
        : '✓ Contrato atualizado com sucesso!';

      alert(msg);
      navigate(-1);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      alert('Erro: ' + (typeof detail === 'string' ? detail : 'Verifique os dados e tente novamente.'));
    } finally {
      setLoading(false);
    }
  };

  // ── Atualiza campo e recalcula spread automaticamente ─────────
  const setF = (field: keyof ContratoForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      setForm(prev => {
        const updated = { ...prev, [field]: value };

        const montante     = Number(field === 'montante'      ? value : updated.montante);
        const valorEnviado = Number(field === 'valor_enviado' ? value : updated.valor_enviado);
        const numParcelas  = Number(field === 'num_parcelas'  ? value : updated.num_parcelas);

        if (montante > 0 && valorEnviado > 0 && numParcelas > 0) {
          updated.spread_por_parcela = parseFloat(
            ((montante - valorEnviado) / numParcelas).toFixed(2)
          );
        }

        return updated;
      });
    };

  const inputCls = "w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold text-slate-700 text-base";

  if (fetching) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="flex items-center gap-3 text-slate-400 font-bold">
        <Loader2 className="animate-spin" size={20} /> Carregando contrato...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 font-sans">
      <div className="max-w-2xl mx-auto">

        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 mb-6 font-medium text-sm transition-colors"
        >
          <ChevronLeft size={18} /> Cancelar e Voltar
        </button>

        <header className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Ajustar <span className="text-indigo-600">Contrato #{id}</span>
          </h1>
          <p className="text-slate-500 mt-2">Apenas os campos alterados serão enviados ao servidor.</p>
        </header>

        {/* Alerta */}
        <div className="mb-8 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-4">
          <div className="p-2 bg-white rounded-lg text-amber-500 shadow-sm">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-amber-800 uppercase tracking-wider">Atenção</h3>
            <p className="text-sm text-amber-700 mt-1">
              Alterar <strong>valor da parcela</strong>, <strong>nº de parcelas</strong>,{' '}
              <strong>data de início</strong> ou <strong>spread</strong> irá deletar e recriar
              todas as parcelas <strong>pendentes</strong> e <strong>atrasadas</strong>.
              Parcelas <strong>pagas</strong> são sempre preservadas.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── DADOS DO CLIENTE ── */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-sm text-violet-600"><User size={20} /></div>
              <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest">Dados do Cliente</h2>
            </div>
            <div className="p-8">
              <label className="block text-[11px] font-black text-slate-400 uppercase mb-2">
                Dia de Vencimento <span className="normal-case font-normal">(1–28)</span>
              </label>
              <input
                type="number" min="1" max="28" required
                value={diaVencimento}
                onChange={e => setDiaVencimento(Number(e.target.value))}
                className={inputCls}
              />
              <p className="text-xs text-slate-400 mt-2">
                Campo salvo no cadastro do cliente — afeta o recálculo das datas de vencimento.
              </p>
            </div>
          </div>

          {/* ── DADOS DO CONTRATO ── */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-sm text-indigo-600"><FileText size={20} /></div>
              <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest">Valores e Prazos</h2>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase mb-2">Capital Enviado (R$)</label>
                <input type="number" step="0.01" value={form.valor_enviado} onChange={setF('valor_enviado')} className={inputCls} />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase mb-2">Montante Total (R$)</label>
                <input type="number" step="0.01" value={form.montante} onChange={setF('montante')} className={inputCls} />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase mb-2">Valor da Parcela (R$) ✦</label>
                <input type="number" step="0.01" required value={form.valor_parcela} onChange={setF('valor_parcela')} className={inputCls} />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase mb-2">
                  Spread por Parcela (R$) ✦
                  <span className="ml-2 normal-case font-normal text-indigo-400">calculado automaticamente</span>
                </label>
                <input
                  type="number" step="0.01" readOnly
                  value={form.spread_por_parcela}
                  className={`${inputCls} bg-indigo-50 text-indigo-700 cursor-not-allowed`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase mb-2">Nº de Parcelas ✦</label>
                <input type="number" min="1" required value={form.num_parcelas} onChange={setF('num_parcelas')} className={inputCls} />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase mb-2">Taxa Mensal (%)</label>
                <input type="number" step="0.0001" value={form.taxa_mensal} onChange={setF('taxa_mensal')} className={inputCls} />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase mb-2">Data de Início ✦</label>
                <input type="date" value={form.data_inicio} onChange={setF('data_inicio')} className={inputCls} />
              </div>

              <div className="flex items-end pb-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={form.ativo}
                    onChange={setF('ativo')}
                    className="w-6 h-6 rounded-lg text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900">
                    Contrato Ativo
                  </span>
                </label>
              </div>

            </div>

            <p className="px-8 pb-6 text-xs text-slate-400">
              ✦ Campos marcados irão <strong>recriar</strong> as parcelas pendentes/atrasadas automaticamente.
            </p>
          </div>

          {/* ── Botão ── */}
          <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
            <div className="flex items-center gap-3 text-indigo-600">
              <Info size={18} />
              <span className="text-xs font-bold uppercase tracking-tight">Parcelas pagas nunca são alteradas</span>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Confirmar e Atualizar
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};