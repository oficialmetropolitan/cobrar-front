export type StatusAdiantamento = 'pendente' | 'recebido' | 'cancelado';

export interface Adiantamento {
  id: number;
  nota_fiscal: string;
  status: StatusAdiantamento;
  valor_enviado: number;
  valor_receber: number;
  spread: number;
  data_enviada: string;
  data_receber: string;
  criado_em: string;
}

export interface AdiantamentoPayload {
  nota_fiscal: string;
  valor_enviado: number;
  valor_receber: number;
  data_enviada?: string;
  data_receber: string;
  status?: StatusAdiantamento;
}

export interface AdiantamentoUpdate {
  nota_fiscal?: string;
  status?: StatusAdiantamento;
  valor_enviado?: number;
  valor_receber?: number;
  data_enviada?: string;
  data_receber?: string;
}

export interface ResumoItem {
  status: StatusAdiantamento;
  quantidade: number;
  total_enviado: number;
  total_a_receber: number;
  total_spread: number;
}

export interface FormState {
  nota_fiscal: string;
  valor_enviado: string;
  valor_receber: string;
  data_enviada: string;
  data_receber: string;
  status: StatusAdiantamento;
}

export const EMPTY_FORM: FormState = {
  nota_fiscal: '',
  valor_enviado: '',
  valor_receber: '',
  data_enviada: new Date().toISOString().split('T')[0],
  data_receber: '',
  status: 'pendente',
};

export const fmt = (v: number | string | null | undefined): string => {
  const n = Number(v);
  if (!n && n !== 0) return '—';
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const fmtDate = (d: string | null | undefined): string => {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');
};

export const diasRestantes = (dataReceber: string): number => {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const data = new Date(dataReceber + 'T00:00:00');
  return Math.ceil((data.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
};