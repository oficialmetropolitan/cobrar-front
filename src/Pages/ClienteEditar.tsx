import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  User, 
  ChevronLeft, 
  Save, 
  Loader2,
  Sparkles
} from 'lucide-react';
import { ClienteService } from '../api/api';
import { CCBExtractor, CCBExtractedData } from './Ccbextractor';

export const ClienteEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExtractor, setShowExtractor] = useState(false);  // ← novo
  const [filledByPDF, setFilledByPDF] = useState(false);      // ← novo

  const [formData, setFormData] = useState({
    nome: '',
    modalidade: 'IPD',
    dia_vencimento: 10,
    telefone: '',
    cpf_cnpj: '',
    email: '',
    ativo: true
  });

  // --- FUNÇÕES DE MÁSCARA ---
  const maskCPFCNPJ = (value: string) => {
    const raw = value.replace(/\D/g, "");
    if (raw.length <= 11) {
      return raw
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    return raw
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .substring(0, 18);
  };

  const maskTelefone = (value: string) => {
    const raw = value.replace(/\D/g, "");
    if (raw.length <= 10) {
      return raw
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }
    return raw
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .substring(0, 15);
  };

  useEffect(() => {
    const carregarCliente = async () => {
      if (!id) return;
      try {
        setFetching(true);
        const res = await ClienteService.buscarPorId(Number(id));
        const cliente = res.data;
        setFormData({
          nome: cliente.nome || '',
          modalidade: cliente.modalidade || 'IPD',
          dia_vencimento: cliente.dia_vencimento || 10,
          telefone: maskTelefone(cliente.telefone || ''),
          cpf_cnpj: maskCPFCNPJ(cliente.cpf_cnpj || ''),
          email: cliente.email || '',
          ativo: cliente.ativo !== false
        });
      } catch (err) {
        setError("Não foi possível carregar os dados.");
      } finally {
        setFetching(false);
      }
    };
    carregarCliente();
  }, [id]);

  // ── Preencher a partir do PDF ──────────────────────────────────────────────
  const handleCCBExtracted = (data: CCBExtractedData) => {
    setFormData(prev => ({
      ...prev,
      nome:          data.nome          ? data.nome                          : prev.nome,
      cpf_cnpj:      data.cpf_cnpj      ? maskCPFCNPJ(data.cpf_cnpj)         : prev.cpf_cnpj,
      telefone:      data.telefone      ? maskTelefone(data.telefone)         : prev.telefone,
      email:         data.email         ? data.email                          : prev.email,
      dia_vencimento: data.dia_vencimento ?? prev.dia_vencimento,
      modalidade:    data.modalidade    ? data.modalidade                     : prev.modalidade,
    }));
    setFilledByPDF(true);
    setShowExtractor(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
    } else if (name === 'cpf_cnpj') {
      setFormData({ ...formData, [name]: maskCPFCNPJ(value) });
    } else if (name === 'telefone') {
      setFormData({ ...formData, [name]: maskTelefone(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setLoading(true);
    try {
      const dadosParaEnviar = {
        ...formData,
        cpf_cnpj: formData.cpf_cnpj.replace(/\D/g, ""),
        telefone: formData.telefone.replace(/\D/g, ""),
        dia_vencimento: Number(formData.dia_vencimento)
      };
      await ClienteService.atualizar(Number(id), dadosParaEnviar);
      alert('Cadastro da Metropolitan atualizado!');
      navigate('/');
    } catch (err: any) {
      alert('Erro ao salvar no banco.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-20 text-center">Carregando...</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">

        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 mb-6 font-medium text-sm">
          <ChevronLeft size={18} /> Voltar
        </button>

        {/* ── Header com botão CCB ── */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Editar <span className="text-indigo-600">Cliente</span>
            </h1>

            {/* Botão abrir/fechar extrator */}
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

            {/* Badge preenchido via PDF */}
            {filledByPDF && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-violet-50 border border-violet-200">
                <Sparkles size={14} className="text-violet-500" />
                <span className="text-xs font-black text-violet-600 uppercase tracking-wider">
                  Atualizado via PDF
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

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-xl shadow-sm text-indigo-600"><User size={20} /></div>
                <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest">Cadastro</h2>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className={`text-xs font-bold uppercase ${formData.ativo ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {formData.ativo ? 'ATIVO' : 'INATIVO'}
                </span>
                <input type="checkbox" name="ativo" checked={formData.ativo} onChange={handleChange} className="w-5 h-5 rounded text-indigo-600" />
              </label>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-black text-slate-400 uppercase mb-2">Nome Completo</label>
                <input type="text" name="nome" required value={formData.nome} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl outline-none font-medium" />
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase mb-2">CPF / CNPJ</label>
                <input type="text" name="cpf_cnpj" placeholder="000.000.000-00" value={formData.cpf_cnpj} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl outline-none font-medium text-indigo-600" />
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase mb-2">Telefone</label>
                <input type="text" name="telefone" placeholder="(00) 00000-0000" value={formData.telefone} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl outline-none font-medium text-indigo-600" />
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase mb-2">E-mail</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl outline-none font-medium" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-sm text-indigo-600"><Save size={20} /></div>
              <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest">Modalidades Metropolitan</h2>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase mb-2">Empresa / Modalidade</label>
                <select name="modalidade" value={formData.modalidade} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl outline-none font-medium appearance-none">
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
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase mb-2">Dia de Vencimento</label>
                <input type="number" name="dia_vencimento" min="1" max="28" required value={formData.dia_vencimento} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl outline-none font-medium" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4">
            <button type="submit" disabled={loading} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};