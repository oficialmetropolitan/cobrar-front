import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus, FileText, ChevronLeft, CheckCircle2,
  Loader2, Info, TrendingUp, Hash, Sparkles
} from 'lucide-react';
import { OnboardingService, OnboardingPayload } from '../api/api';
import { CCBExtractor, CCBExtractedData } from './Ccbextractor'; 
import { toast } from 'sonner';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type FormData = {
  nome: string;
  modalidade: string;
  dia_vencimento: number;
  telefone: string;
  cpf_cnpj: string;
  email: string;
  valor_enviado: string;
  montante: string;
  taxa_mensal: string;
  spread_total: string;
  num_parcelas: number;
  data_inicio: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: string | number): string {
  const n = Number(value);
  if (!n || isNaN(n)) return '—';
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function calcValorParcela(montante: string, parcelas: number): number {
  const m = parseFloat(montante);
  if (!m || !parcelas) return 0;
  return parseFloat((m / parcelas).toFixed(2));
}

// ─── Componente ───────────────────────────────────────────────────────────────

export const ClienteForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [showExtractor, setShowExtractor] = useState(false); // <-- controla o painel do extrator
  const [filledByPDF, setFilledByPDF] = useState(false);    // <-- badge "preenchido via PDF"

  const [formData, setFormData] = useState<FormData>({
    nome: '',
    modalidade: 'mensal',
    dia_vencimento: 10,
    telefone: '',
    cpf_cnpj: '',
    email: '',
    valor_enviado: '',
    montante: '',
    taxa_mensal: '',
    spread_total: '',
    num_parcelas: 1,
    data_inicio: new Date().toISOString().split('T')[0],
  });

  const valorParcela = useMemo(
    () => calcValorParcela(formData.montante || formData.valor_enviado, formData.num_parcelas),
    [formData.montante, formData.valor_enviado, formData.num_parcelas]
  );

  // ── Preencher a partir do PDF ─────────────────────────────────────────────

  const handleCCBExtracted = (data: CCBExtractedData) => {
    setFormData({
      nome: data.nome || '',
      cpf_cnpj: data.cpf_cnpj || '',
      telefone: data.telefone || '',
      email: data.email || '',
      valor_enviado: data.valor_enviado?.toString() || '',
      montante: data.montante?.toString() || '',
      taxa_mensal: data.taxa_mensal?.toString() || '',
      spread_total: data.spread_total?.toString() || '',
      num_parcelas: data.num_parcelas || 1,
      dia_vencimento: data.dia_vencimento || 10,
      data_inicio: data.data_inicio || new Date().toISOString().split('T')[0],
      modalidade: data.modalidade || '',
    });
    setFilledByPDF(true);
    setShowExtractor(false);
    setErrors({});
  };

// ─── Helpers Adicionais ────────────────────────────────────────────────────────

function preparePhoneForDB(phone: string): string | undefined {
  if (!phone) return undefined;

  let raw = phone.replace(/\D/g, '');

  if (raw.length === 10 || raw.length === 11) {
    raw = '55' + raw;
  }

  return `+${raw}`;
}

  // ── Validação ─────────────────────────────────────────────────────────────


  function validate(): boolean {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!formData.nome.trim()) e.nome = 'Nome obrigatório';
    const dv = Number(formData.dia_vencimento);
    if (!dv || dv < 1 || dv > 28) e.dia_vencimento = 'Use um dia entre 1 e 28';
    const ve = parseFloat(formData.valor_enviado);
    if (!ve || ve <= 0) e.valor_enviado = 'Informe um valor válido';
    if (formData.num_parcelas < 1) e.num_parcelas = 'Mínimo 1 parcela';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
if (name === 'telefone') {
    const formatted = value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .substring(0, 15);
    setFormData(prev => ({ ...prev, [name]: formatted }));
  } else {
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  if (errors[name as keyof FormData])
    setErrors(prev => ({ ...prev, [name]: undefined }));
}
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const montante = parseFloat(formData.montante || formData.valor_enviado);
      const valorEnviado = parseFloat(formData.valor_enviado);
      const payload: OnboardingPayload = {
        nome: formData.nome.trim(),
        modalidade: formData.modalidade,
        dia_vencimento: Number(formData.dia_vencimento),
        telefone: preparePhoneForDB(formData.telefone),
        email: formData.email || undefined,
        cpf_cnpj: formData.cpf_cnpj || undefined,
        valor_enviado: valorEnviado,
        montante,
        num_parcelas: Number(formData.num_parcelas),
        valor_parcela: valorParcela,
        taxa_mensal: formData.taxa_mensal ? parseFloat(formData.taxa_mensal) : undefined,
        spread_total: formData.spread_total ? parseFloat(formData.spread_total) : undefined,
        spread_por_parcela: formData.spread_total
          ? parseFloat((parseFloat(formData.spread_total) / formData.num_parcelas).toFixed(2))
          : undefined,
        data_inicio: formData.data_inicio,
      };
      await OnboardingService.criar(payload);
      toast.success('Cliente criado com sucesso!');
      navigate('/');
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      const msg =
        typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
          ? detail.map((d: any) => d.msg).join(', ')
          : 'Verifique os dados e tente novamente.';
      toast.error('Erro ao salvar: ' + msg);
    } finally {
      setLoading(false);
    }
  }

  const aplicarSpreadAutomatico = () => {
    const vEnviado = parseFloat(formData.valor_enviado);
    const vMontante = parseFloat(formData.montante);
    if (vEnviado && vMontante && vMontante > vEnviado) {
      const spread = (vMontante - vEnviado).toFixed(2);
      setFormData(prev => ({ ...prev, spread_total: spread }));
      toast.success('Diferença calculada e aplicada ao Spread.');
    } else {
      toast.error('Para calcular o spread, o Montante deve ser maior que o Valor Enviado.');
    }
  };

  const inputCls = (field: keyof FormData) =>
    `w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border rounded-2xl outline-none font-medium transition-all text-slate-900 dark:text-white
     focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 dark:border-slate-700/50
     ${errors[field] ? 'border-red-300 bg-red-50 dark:bg-red-900/10' : 'border-transparent'}`;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-200">
      <div className="max-w-3xl mx-auto">

        {/* Voltar */}
        <button
          onClick={() => navigate('/')}
          className="group flex items-center gap-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-6 font-medium text-sm"
        >
          <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Voltar para listagem
        </button>

        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Novo <span className="text-indigo-600 dark:text-indigo-400">Cadastro</span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
                Crie o cliente e gere o contrato com parcelas em uma única operação.
              </p>
            </div>

            {!filledByPDF && (
              <button
                type="button"
                onClick={() => setShowExtractor(v => !v)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm transition-all
                  ${showExtractor
                    ? 'bg-violet-100 text-violet-700'
                    : 'bg-slate-900 text-white hover:bg-violet-600'}`}
              >
                <Sparkles size={16} />
                {showExtractor ? 'Fechar importação' : 'Importar CCB (PDF)'}
              </button>
            )}

            {/* Badge: preenchido via PDF */}
            {filledByPDF && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-violet-50 border border-violet-200">
                <Sparkles size={14} className="text-violet-500" />
                <span className="text-xs font-black text-violet-600 uppercase tracking-wider">
                  Preenchido via PDF
                </span>
                <button
                  type="button"
                  onClick={() => { setFilledByPDF(false); setShowExtractor(true); }}
                  className="text-violet-400 hover:text-violet-700 text-xs underline ml-1"
                >
                  trocar
                </button>
              </div>
            )}
          </div>
        </header>

        {/* ── Painel do Extrator CCB ── */}
        {showExtractor && (
          <div className="mb-6">
            <CCBExtractor onDataExtracted={handleCCBExtracted} />
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-8">

          {/* ── DADOS DO CLIENTE ── */}
          <section className="bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden transition-colors">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/30 flex items-center gap-3">
              <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-indigo-600 dark:text-indigo-400">
                <UserPlus size={20} />
              </div>
              <h2 className="text-sm font-black text-slate-700 dark:text-white uppercase tracking-widest">
                Informações do Cliente
              </h2>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">

              <div className="md:col-span-2">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text" name="nome" required
                  value={formData.nome} onChange={handleChange}
                  placeholder="Ex: Isabella Pila"
                  className={inputCls('nome')}
                />
                {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                  CPF / CNPJ
                </label>
                <input
                  type="text" name="cpf_cnpj"
                  value={formData.cpf_cnpj} onChange={handleChange}
                  placeholder="Somente números"
                  className={inputCls('cpf_cnpj')}
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                  Telefone
                </label>
                <input
                  type="text" name="telefone"
                  value={formData.telefone} onChange={handleChange}
                  placeholder="(00) 00000-0000"
                  className={inputCls('telefone')}
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                  E-mail
                </label>
                <input
                  type="email" name="email"
                  value={formData.email} onChange={handleChange}
                  placeholder="cliente@email.com"
                  className={inputCls('email')}
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                  Dia de Vencimento * <span className="normal-case font-normal text-slate-400">(1–28)</span>
                </label>
                <input
                  type="number" name="dia_vencimento" min="1" max="28" required
                  value={formData.dia_vencimento} onChange={handleChange}
                  className={inputCls('dia_vencimento')}
                />
                {errors.dia_vencimento && (
                  <p className="text-red-500 text-xs mt-1">{errors.dia_vencimento}</p>
                )}
              </div>
            </div>
          </section>

          {/* ── CONTRATO & PARCELAS ── */}
          <section className="bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden transition-colors">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/30 flex items-center gap-3">
              <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-emerald-600 dark:text-emerald-400">
                <FileText size={20} />
              </div>
              <h2 className="text-sm font-black text-slate-700 dark:text-white uppercase tracking-widest">
                Contrato e Parcelas
              </h2>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                  Valor Enviado *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                  <input
                    type="number" name="valor_enviado" step="0.01" required
                    value={formData.valor_enviado} onChange={handleChange}
                    placeholder="0,00"
                    className={`${inputCls('valor_enviado')} pl-12`}
                  />
                </div>
                {errors.valor_enviado && (
                  <p className="text-red-500 text-xs mt-1">{errors.valor_enviado}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                  Montante <span className="normal-case font-normal">(padrão = valor enviado)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                  <input
                    type="number" name="montante" step="0.01"
                    value={formData.montante} onChange={handleChange}
                    placeholder="0,00"
                    className={`${inputCls('montante')} pl-12`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                  Taxa Mensal (%)
                </label>
                <div className="relative">
                  <TrendingUp size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number" name="taxa_mensal" step="0.01"
                    value={formData.taxa_mensal} onChange={handleChange}
                    placeholder="0,00"
                    className={`${inputCls('taxa_mensal')} pl-10`}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider">
                    Spread Total
                  </label>
                  <button
                    type="button"
                    onClick={aplicarSpreadAutomatico}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-tighter transition-colors"
                  >
                    Calcular Diferença
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                  <input
                    type="number" name="spread_total" step="0.01"
                    value={formData.spread_total} onChange={handleChange}
                    placeholder="0,00"
                    className={`${inputCls('spread_total')} pl-12`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                  Nº de Parcelas *
                </label>
                <div className="relative">
                  <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number" name="num_parcelas" min="1" required
                    value={formData.num_parcelas} onChange={handleChange}
                    className={`${inputCls('num_parcelas')} pl-10`}
                  />
                </div>
                {errors.num_parcelas && (
                  <p className="text-red-500 text-xs mt-1">{errors.num_parcelas}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                  Modalidade *
                </label>
                <select
                  name="modalidade"
                  value={formData.modalidade} onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 outline-none font-medium text-slate-700 appearance-none cursor-pointer transition-all"
                >
                  <option value="">Selecione a Modalidade</option>
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

              <div className="md:col-span-2">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                  Data de Início
                </label>
                <input
                  type="date" name="data_inicio"
                  value={formData.data_inicio} onChange={handleChange}
                  className={inputCls('data_inicio')}
                />
              </div>
            </div>

            {valorParcela > 0 && (
              <div className="mx-8 mb-6 p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-indigo-700 dark:text-indigo-400 font-medium">
                  <CheckCircle2 size={16} className="text-indigo-500 dark:text-indigo-400" />
                  Valor calculado por parcela
                </div>
                <span className="text-indigo-800 dark:text-indigo-300 font-black text-lg">
                  {formatCurrency(valorParcela)}
                </span>
              </div>
            )}

            <div className="mx-8 mb-8 p-4 bg-amber-50 dark:bg-amber-500/10 rounded-2xl border border-amber-100 dark:border-amber-500/20 flex gap-3 text-xs text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
              <Info size={18} className="text-amber-500 shrink-0 mt-0.5" />
              As parcelas serão geradas automaticamente respeitando o dia de vencimento e a data de início informados.
            </div>
          </section>

          {/* ── AÇÕES ── */}
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-8 py-4 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-indigo-600 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
              {loading ? 'Processando...' : 'Concluir Cadastro'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};