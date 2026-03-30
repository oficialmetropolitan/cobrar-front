import React, { useState, useEffect } from 'react';
import { ParcelaService } from '../api/api';

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

  // ─────────────── LOAD ───────────────
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

  // ─────────────── CHECKBOX ───────────────
  const toggleSelecao = (id: number) => {
    setSelecionados(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const selecionarTodos = () => {
    if (selecionados.length === parcelas.length) {
      setSelecionados([]);
    } else {
      setSelecionados(parcelas.map(p => p.id));
    }
  };

  // ─────────────── BAIXA MANUAL ───────────────
  const executarBaixaEmLote = async () => {
    if (selecionados.length === 0) return;

    const confirmar = window.confirm(
      `Deseja confirmar o pagamento de ${selecionados.length} parcelas?`
    );
    if (!confirmar) return;

    setProcessando(true);

    try {
      await ParcelaService.baixar_lote(selecionados);
      alert('Sucesso: Repasse processado!');
      carregarDados();
    } catch {
      alert('Erro ao processar baixa em lote.');
    } finally {
      setProcessando(false);
    }
  };

  // ─────────────── BAIXA AUTOMÁTICA ───────────────
  const executarBaixaAutomatica = async () => {
    if (!mesFiltro || !modalidade) {
      alert('Selecione mês e modalidade');
      return;
    }

    const confirmar = window.confirm(
      `Baixar TODAS as parcelas de ${modalidade} no mês ${mesFiltro}?`
    );
    if (!confirmar) return;

    setProcessando(true);

    try {
      const res = await ParcelaService.baixar_consignado(mesFiltro, modalidade);

      alert(`Sucesso! ${res.data.total_baixado} parcelas baixadas.`);
      carregarDados();
    } catch (err) {
      console.error(err);
      alert('Erro na baixa automática');
    } finally {
      setProcessando(false);
    }
  };

  // ─────────────── TOTAL ───────────────
  const valorTotalSelecionado = parcelas
    .filter(p => selecionados.includes(p.id))
    .reduce((sum, p) => sum + p.valor, 0);

  // ─────────────── UI ───────────────
  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">

        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Repasse Consignado
          </h2>
          <p className="text-slate-500 text-sm">
            Baixa manual ou automática por mês
          </p>
        </div>

        <div className="flex flex-wrap gap-3 items-end">

          {/* MÊS */}
          <div>
            <span className="text-xs text-slate-400">Mês</span>
            <input
              type="month"
              value={mesFiltro}
              onChange={(e) => setMesFiltro(e.target.value)}
              className="border p-2 rounded-xl"
            />
          </div>

          {/* MODALIDADE */}
          <div>
            <span className="text-xs text-slate-400">Modalidade</span>
            <select
              value={modalidade}
              onChange={(e) => setModalidade(e.target.value)}
              className="border p-2 rounded-xl"
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

          {/* BOTÕES */}
          <button
            onClick={executarBaixaEmLote}
            disabled={selecionados.length === 0 || processando}
            className="bg-emerald-500 text-white px-4 py-2 rounded-xl"
          >
            Baixar Selecionados ({selecionados.length})
          </button>

          <button
            onClick={executarBaixaAutomatica}
            disabled={processando}
            className="bg-indigo-500 text-white px-4 py-2 rounded-xl"
          >
            Baixa Automática
          </button>

        </div>
      </div>

      {/* TOTAL */}
      {selecionados.length > 0 && (
        <div className="mb-4 p-4 bg-indigo-50 rounded-xl">
          Total: R$ {valorTotalSelecionado.toFixed(2)}
        </div>
      )}

      {/* TABELA */}
      <table className="w-full">

        <thead>
          <tr className="text-left text-sm text-slate-500">
            <th>
              <input
                type="checkbox"
                onChange={selecionarTodos}
                checked={selecionados.length === parcelas.length && parcelas.length > 0}
              />
            </th>
            <th>Cliente</th>
            <th>Parcela</th>
            <th>Vencimento</th>
            <th>Valor</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {carregando ? (
            <tr>
              <td colSpan={6}>Carregando...</td>
            </tr>
          ) : parcelas.map(p => (
            <tr key={p.id} className="border-b">

              <td>
                <input
                  type="checkbox"
                  checked={selecionados.includes(p.id)}
                  onChange={() => toggleSelecao(p.id)}
                />
              </td>

              <td>{p.cliente_nome}</td>

              <td>
                {p.numero_parcela}/{p.total_parcelas}
              </td>

              <td>
                {new Date(p.data_vencimento).toLocaleDateString('pt-BR')}
              </td>

              <td>
                R$ {p.valor.toFixed(2)}
              </td>

              <td>{p.status}</td>

            </tr>
          ))}
        </tbody>

      </table>

    </div>
  );
};