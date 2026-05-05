import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus, RefreshCw, CheckCircle2, XCircle, Pencil,
  TrendingUp, Clock, Ban, ChevronDown, X, AlertCircle,
} from 'lucide-react';
import { AdiantamentoService, AdiantamentoPayload, AdiantamentoUpdate } from '../api/api';
import {
  Adiantamento, ResumoItem, FormState, StatusAdiantamento,
  EMPTY_FORM, fmt, fmtDate, diasRestantes,
} from '../types/adiantamento';
import { toast } from 'sonner';

// ─── Constantes de estilo ────────────────────────────────────────────────────

const STATUS_CFG: Record<StatusAdiantamento, { label: string; bg: string; text: string; border: string; dot: string }> = {
  pendente:  { label: 'Pendente',  bg: '#fff7ed', text: '#c2410c', border: '#fed7aa', dot: '#f97316' },
  recebido:  { label: 'Recebido',  bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', dot: '#22c55e' },
  cancelado: { label: 'Cancelado', bg: '#fef2f2', text: '#b91c1c', border: '#fecaca', dot: '#ef4444' },
};

// ─── Sub-componentes ─────────────────────────────────────────────────────────

interface BadgeProps { status: StatusAdiantamento }
const Badge: React.FC<BadgeProps> = ({ status }) => {
  const c = STATUS_CFG[status];
  return (
    <span style={{
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      borderRadius: 99, padding: '3px 11px', fontSize: 12, fontWeight: 700,
      display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot }} />
      {c.label}
    </span>
  );
};



// ─── Modal ───────────────────────────────────────────────────────────────────

interface ModalProps { title: string; onClose: () => void; children: React.ReactNode }
const Modal: React.FC<ModalProps> = ({ title, onClose, children }) => (
  <div
    style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(4px)' }}
    onClick={onClose}
  >
    <div
      style={{ background: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 500, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', animation: 'popIn .22s cubic-bezier(.34,1.56,.64,1)' }}
      onClick={e => e.stopPropagation()}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>{title}</h2>
        <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
          <X size={16} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

// ─── Formulário ──────────────────────────────────────────────────────────────

const inputCls: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: '1.5px solid #e2e8f0', borderRadius: 10,
  fontSize: 14, fontFamily: 'inherit', color: '#0f172a',
  background: '#f8fafc', outline: 'none',
  transition: 'border-color .15s', boxSizing: 'border-box',
};

interface FormFieldProps { label: string; children: React.ReactNode; error?: string }
const FormField: React.FC<FormFieldProps> = ({ label, children, error }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
      {label}
    </label>
    {children}
    {error && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#dc2626', fontWeight: 500 }}>{error}</p>}
  </div>
);

interface AdiantamentoFormProps {
  form: FormState;
  onChange: (f: FormState) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isEdit: boolean;
  loading: boolean;
}

const AdiantamentoForm: React.FC<AdiantamentoFormProps> = ({ form, onChange, onSubmit, onCancel, isEdit, loading }) => {
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onChange({ ...form, [key]: e.target.value });
    setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const spread = useMemo(() => {
    const ve = parseFloat(form.valor_enviado);
    const vr = parseFloat(form.valor_receber);
    if (ve > 0 && vr > 0) return (vr - ve).toFixed(2);
    return null;
  }, [form.valor_enviado, form.valor_receber]);

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.nota_fiscal.trim()) e.nota_fiscal = 'Obrigatório';
    if (!form.valor_enviado || parseFloat(form.valor_enviado) <= 0) e.valor_enviado = 'Informe um valor válido';
    if (!form.valor_receber || parseFloat(form.valor_receber) <= 0) e.valor_receber = 'Informe um valor válido';
    if (form.valor_receber && form.valor_enviado && parseFloat(form.valor_receber) < parseFloat(form.valor_enviado))
      e.valor_receber = 'Deve ser ≥ ao valor enviado';
    if (!form.data_receber) e.data_receber = 'Obrigatório';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FormField label="Nota Fiscal *" error={errors.nota_fiscal}>
        <input style={inputCls} value={form.nota_fiscal} onChange={set('nota_fiscal')} placeholder="Ex: NF-2025-001" />
      </FormField>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormField label="Valor Enviado *" error={errors.valor_enviado}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#94a3b8', fontWeight: 700 }}>R$</span>
            <input style={{ ...inputCls, paddingLeft: 36 }} type="number" step="0.01" value={form.valor_enviado} onChange={set('valor_enviado')} placeholder="0,00" />
          </div>
        </FormField>
        <FormField label="Valor a Receber *" error={errors.valor_receber}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#94a3b8', fontWeight: 700 }}>R$</span>
            <input style={{ ...inputCls, paddingLeft: 36 }} type="number" step="0.01" value={form.valor_receber} onChange={set('valor_receber')} placeholder="0,00" />
          </div>
        </FormField>
      </div>

      {spread !== null && (
        <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#7c3aed', fontWeight: 600 }}>Spread calculado</span>
          <span style={{ fontWeight: 800, color: '#7c3aed', fontSize: 15 }}>{fmt(spread)}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormField label="Data Enviada">
          <input style={inputCls} type="date" value={form.data_enviada} onChange={set('data_enviada')} />
        </FormField>
        <FormField label="Data a Receber *" error={errors.data_receber}>
          <input style={inputCls} type="date" value={form.data_receber} onChange={set('data_receber')} />
        </FormField>
      </div>

      {isEdit && (
        <FormField label="Status">
          <div style={{ position: 'relative' }}>
            <select style={{ ...inputCls, appearance: 'none', paddingRight: 36, cursor: 'pointer' }} value={form.status} onChange={set('status')}>
              <option value="pendente">Pendente</option>
              <option value="recebido">Recebido</option>
              <option value="cancelado">Cancelado</option>
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          </div>
        </FormField>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button type="button" onClick={onCancel} style={{ flex: 1, padding: '12px', borderRadius: 10, background: '#f1f5f9', color: '#64748b', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Cancelar
        </button>
        <button type="submit" disabled={loading} style={{ flex: 2, padding: '12px', borderRadius: 10, background: '#0f172a', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {loading ? <><RefreshCw size={15} className="spin" /> Salvando...</> : isEdit ? 'Salvar Alterações' : 'Criar Adiantamento'}
        </button>
      </div>
    </form>
  );
};

// ─── Página principal ────────────────────────────────────────────────────────

type ModalType = 'create' | 'edit' | null;

export const AdiantamentosPage: React.FC = () => {
  const [items, setItems] = useState<Adiantamento[]>([]);
  const [resumo, setResumo] = useState<ResumoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [modal, setModal] = useState<ModalType>(null);
  const [selected, setSelected] = useState<Adiantamento | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const notify = useCallback((msg: string, type: 'ok' | 'error' = 'ok') => {
    if (type === 'error') toast.error(msg);
    else toast.success(msg);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        AdiantamentoService.listar(filterStatus || undefined),
        AdiantamentoService.resumo(),
      ]);
      setItems(r1.data);
      setResumo(r2.data);
    } catch {
      notify('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, notify]);

  useEffect(() => { load(); }, [load]);

  // ── handlers ──────────────────────────────────────────────────────────────

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const payload: AdiantamentoPayload = {
        nota_fiscal: form.nota_fiscal.trim(),
        valor_enviado: parseFloat(form.valor_enviado),
        valor_receber: parseFloat(form.valor_receber),
        data_enviada: form.data_enviada || undefined,
        data_receber: form.data_receber,
      };
      await AdiantamentoService.criar(payload);
      notify('✓ Adiantamento criado com sucesso!');
      setModal(null);
      load();
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      notify(typeof detail === 'string' ? detail : 'Erro ao criar adiantamento', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSubmitLoading(true);
    try {
      const payload: AdiantamentoUpdate = {};
      if (form.nota_fiscal !== selected.nota_fiscal) payload.nota_fiscal = form.nota_fiscal;
      if (form.status !== selected.status) payload.status = form.status as StatusAdiantamento;
      if (parseFloat(form.valor_enviado) !== Number(selected.valor_enviado)) payload.valor_enviado = parseFloat(form.valor_enviado);
      if (parseFloat(form.valor_receber) !== Number(selected.valor_receber)) payload.valor_receber = parseFloat(form.valor_receber);
      if (form.data_receber !== selected.data_receber) payload.data_receber = form.data_receber;
      if (form.data_enviada !== selected.data_enviada) payload.data_enviada = form.data_enviada;

      await AdiantamentoService.atualizar(selected.id, payload);
      notify('✓ Atualizado com sucesso!');
      setModal(null);
      load();
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      notify(typeof detail === 'string' ? detail : 'Erro ao atualizar', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleReceber = async (id: number) => {
    setActionLoading(id);
    try {
      await AdiantamentoService.marcarRecebido(id);
      notify('✓ Marcado como recebido!');
      load();
    } catch (err: any) {
      notify(err.response?.data?.detail || 'Erro', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelar = async (id: number) => {
    if (!window.confirm('Cancelar este adiantamento?')) return;
    setActionLoading(id);
    try {
      await AdiantamentoService.cancelar(id);
      notify('Adiantamento cancelado.');
      load();
    } catch {
      notify('Erro ao cancelar', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, data_enviada: new Date().toISOString().split('T')[0] });
    setSelected(null);
    setModal('create');
  };

  const openEdit = (item: Adiantamento) => {
    setSelected(item);
    setForm({
      nota_fiscal: item.nota_fiscal,
      valor_enviado: String(item.valor_enviado),
      valor_receber: String(item.valor_receber),
      data_enviada: item.data_enviada,
      data_receber: item.data_receber,
      status: item.status,
    });
    setModal('edit');
  };

  // ── resumo cards ───────────────────────────────────────────────────────────

  const pendente = resumo.find(r => r.status === 'pendente');
  const recebido = resumo.find(r => r.status === 'recebido');

  const cards = [
    { label: 'A Receber', value: fmt(pendente?.total_a_receber ?? 0), sub: `${pendente?.quantidade ?? 0} pendentes`, color: '#f97316', icon: <Clock size={18} /> },
    { label: 'Spread Pendente', value: fmt(pendente?.total_spread ?? 0), sub: 'lucro projetado', color: '#7c3aed', icon: <TrendingUp size={18} /> },
    { label: 'Total Recebido', value: fmt(recebido?.total_a_receber ?? 0), sub: `${recebido?.quantidade ?? 0} finalizados`, color: '#16a34a', icon: <CheckCircle2 size={18} /> },
    { label: 'Spread Realizado', value: fmt(recebido?.total_spread ?? 0), sub: 'lucro obtido', color: '#0ea5e9', icon: <TrendingUp size={18} /> },
  ];

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        .adi-page { font-family: 'Sora', sans-serif; }
        .adi-page input, .adi-page select, .adi-page button { font-family: 'Sora', sans-serif; }
        .adi-page input:focus, .adi-page select:focus { border-color: #0f172a !important; box-shadow: 0 0 0 3px rgba(15,23,42,0.07); }
        .adi-btn-action { transition: all .15s; }
        .adi-btn-action:hover { opacity: 0.85; transform: translateY(-1px); }
        .adi-row:hover td { background: #f8fafc !important; }
        .spin { animation: spin .7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes popIn { from { opacity:0; transform:scale(.94) } to { opacity:1; transform:scale(1) } }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 99px; }

        /* Dark Mode Overrides */
        html.dark .adi-page { background: #0B0F19 !important; }
        html.dark .adi-page h1, html.dark .adi-page p, html.dark .adi-page div, html.dark .adi-page span, html.dark .adi-page td, html.dark .adi-page th { color: #f1f5f9; }
        html.dark .adi-page [style*="color: #94a3b8"] { color: #64748b !important; }
        html.dark .adi-page [style*="color: #0f172a"] { color: #f8fafc !important; }
        html.dark .adi-page [style*="background: #fff"] { background: rgba(30,41,59,0.5) !important; border-color: rgba(255,255,255,0.1) !important; }
        html.dark .adi-page [style*="background: #f8fafc"] { background: rgba(15,23,42,0.5) !important; border-color: rgba(255,255,255,0.05) !important; }
        html.dark .adi-page [style*="border-bottom: 2px solid #f1f5f9"] { border-bottom: 2px solid rgba(255,255,255,0.1) !important; }
        html.dark .adi-page [style*="border-bottom: 1px solid #f1f5f9"] { border-bottom: 1px solid rgba(255,255,255,0.05) !important; }
        html.dark .adi-row:hover td { background: rgba(255,255,255,0.02) !important; }
        
        /* Modals and inputs */
        html.dark [style*="background: rgba(15,23,42,0.55)"] { background: rgba(0,0,0,0.7) !important; }
        html.dark [style*="background: #fff; border-radius: 20px"] { background: #1E293B !important; }
        html.dark [style*="background: #f8fafc"] { background: #0F172A !important; border-color: rgba(255,255,255,0.1) !important; color: #fff !important; }
      `}</style>

      <div className="adi-page" style={{ minHeight: '100vh', background: '#f8fafc', padding: '32px 24px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>

          {/* ── Header ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                Financeiro
              </p>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', margin: 0 }}>
                Adiantamento de Recebíveis
              </h1>
            </div>
            <button
              onClick={openCreate}
              className="adi-btn-action"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#0f172a', color: '#fff', border: 'none',
                borderRadius: 12, padding: '12px 20px', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', boxShadow: '0 4px 16px rgba(15,23,42,0.18)',
              }}
            >
              <Plus size={16} />
              Novo Adiantamento
            </button>
          </div>

          {/* ── Cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 16, marginBottom: 28 }}>
            {cards.map(c => (
              <div key={c.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{ color: c.color, display: 'flex' }}>{c.icon}</div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{c.label}</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: c.color, letterSpacing: '-0.02em', fontFamily: "'JetBrains Mono', monospace" }}>{c.value}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, fontWeight: 500 }}>{c.sub}</div>
              </div>
            ))}
          </div>

          {/* ── Filtros ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
            {(['', 'pendente', 'recebido', 'cancelado'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                style={{
                  padding: '7px 16px', borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  transition: 'all .15s',
                  background: filterStatus === s ? '#0f172a' : '#fff',
                  color: filterStatus === s ? '#fff' : '#64748b',
                  border: `1.5px solid ${filterStatus === s ? '#0f172a' : '#e2e8f0'}`,
                }}
              >
                {s === '' ? 'Todos' : STATUS_CFG[s as StatusAdiantamento]?.label ?? s}
              </button>
            ))}
            <button
              onClick={load}
              className="adi-btn-action"
              style={{ marginLeft: 'auto', padding: '7px 14px', borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: '#fff', color: '#64748b', border: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCw size={13} className={loading ? 'spin' : ''} />
              Atualizar
            </button>
          </div>

          {/* ── Tabela ── */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
            {loading ? (
              <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <RefreshCw size={24} className="spin" style={{ color: '#cbd5e1' }} />
                <span style={{ fontSize: 14, fontWeight: 500 }}>Carregando...</span>
              </div>
            ) : items.length === 0 ? (
              <div style={{ padding: 72, textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Nenhum adiantamento</div>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>Clique em "Novo Adiantamento" para começar.</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                      {['Nota Fiscal', 'Status', 'Valor Enviado', 'Valor a Receber', 'Spread', 'Enviado em', 'Receber em', 'Ações'].map(h => (
                        <th key={h} style={{ padding: '13px 18px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => {
                      const dias = item.status === 'pendente' ? diasRestantes(item.data_receber) : null;
                      const isLoading = actionLoading === item.id;
                      return (
                        <tr key={item.id} className="adi-row" style={{ animation: `fadeIn .3s ease ${idx * 0.04}s both` }}>
                          <td style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{item.nota_fiscal}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>#{item.id}</div>
                          </td>
                          <td style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
                            <Badge status={item.status} />
                          </td>
                          <td style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: '#475569' }}>
                            {fmt(item.valor_enviado)}
                          </td>
                          <td style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                            {fmt(item.valor_receber)}
                          </td>
                          <td style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: '#7c3aed' }}>
                            {fmt(item.spread)}
                          </td>
                          <td style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', fontSize: 13, color: '#64748b' }}>
                            {fmtDate(item.data_enviada)}
                          </td>
                          <td style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ fontSize: 13, fontWeight: item.status === 'pendente' ? 700 : 400, color: dias !== null && dias < 0 ? '#dc2626' : dias !== null && dias <= 3 ? '#f97316' : '#0f172a' }}>
                              {fmtDate(item.data_receber)}
                            </div>
                            {dias !== null && (
                              <div style={{ fontSize: 11, marginTop: 2, color: dias < 0 ? '#dc2626' : dias === 0 ? '#f97316' : '#94a3b8', fontWeight: 600 }}>
                                {dias < 0 ? `${Math.abs(dias)}d em atraso` : dias === 0 ? 'Vence hoje' : `em ${dias}d`}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap' }}>
                              <button
                                onClick={() => openEdit(item)}
                                disabled={isLoading}
                                className="adi-btn-action"
                                style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                              >
                                <Pencil size={12} /> Editar
                              </button>
                              {item.status === 'pendente' && (
                                <button
                                  onClick={() => handleReceber(item.id)}
                                  disabled={isLoading}
                                  className="adi-btn-action"
                                  style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                                >
                                  {isLoading ? <RefreshCw size={12} className="spin" /> : <CheckCircle2 size={12} />}
                                  Receber
                                </button>
                              )}
                              {item.status !== 'cancelado' && (
                                <button
                                  onClick={() => handleCancelar(item.id)}
                                  disabled={isLoading}
                                  className="adi-btn-action"
                                  style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                                >
                                  {isLoading ? <RefreshCw size={12} className="spin" /> : <Ban size={12} />}
                                  Cancelar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Rodapé contagem ── */}
          {!loading && items.length > 0 && (
            <div style={{ marginTop: 12, fontSize: 12, color: '#94a3b8', fontWeight: 500, textAlign: 'right' }}>
              {items.length} registro{items.length !== 1 ? 's' : ''} encontrado{items.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {modal && (
        <Modal
          title={modal === 'create' ? 'Novo Adiantamento' : 'Editar Adiantamento'}
          onClose={() => setModal(null)}
        >
          <AdiantamentoForm
            form={form}
            onChange={setForm}
            onSubmit={modal === 'create' ? handleCreate : handleEdit}
            onCancel={() => setModal(null)}
            isEdit={modal === 'edit'}
            loading={submitLoading}
          />
        </Modal>
      )}
    </>
  );
};

export default AdiantamentosPage;