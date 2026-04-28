/// <reference types="vite/client" />
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';


const api = axios.create({
  baseURL: API_URL,
  headers: {
    'x-api-key': import.meta.env.VITE_API_KEY
  }
});



export interface OnboardingPayload {
  // Cliente
  nome: string;
  modalidade: string;
  dia_vencimento: number;
  telefone?: string;
  email?: string;
  cpf_cnpj?: string;
  // Contrato
  valor_enviado: number;
  montante: number;
  spread_total?: number;
  num_parcelas: number;
  taxa_mensal?: number;
  valor_parcela: number;
  spread_por_parcela?: number;
  data_inicio?: string;
}

export const OnboardingService = {
  criar: (dados: OnboardingPayload) => api.post('/onboarding/', dados),
};

// ─────────────── Clientes ───────────────

export const ClienteService = {
  listar: (search?: string, modalidade?: string) =>
    api.get('/clientes/', { params: { search, modalidade } }),
  buscarPorId: (id: number) => api.get(`/clientes/${id}`),
  criar: (dados: any) => api.post('/clientes/', dados),
  atualizar: (id: number, dados: any) => api.patch(`/clientes/${id}`, dados),
  desativar: (id: number) => api.delete(`/clientes/${id}`),
  buscarContratos: (id: number) => api.get(`/clientes/${id}/contratos`),
  buscarParcelas: (id: number) => api.get(`/clientes/${id}/parcelas`),
atualizarStatus: (id: number, status: string) =>
    api.patch(`/clientes/${id}`, { status }),
excluir: (id: number) => api.delete(`/clientes/${id}`),
 atualizarDiaVencimento: (clienteId: number, novoDia: number) =>
    api.patch(`/clientes/${clienteId}/dia-vencimento`, null, {
      params: { novo_dia: novoDia },
    }),

};

// ─────────────── Contratos ───────────────

export const ContratoService = {
  listar: (ativo: boolean = true) => api.get('/contratos/', { params: { ativo } }),
  buscarPorId: (id: number) => api.get(`/contratos/${id}`),
  criar: (dados: any) => api.post('/contratos/', dados),
  atualizar: (id: number, dados: any) => api.patch(`/contratos/${id}`, dados),
  desativar: (id: number) => api.delete(`/contratos/${id}`),
 
};

// ─────────────── Parcelas ───────────────

export const ParcelaService = {
listar(status?: string, mes?: string, modalidade?: string) {
  return api.get('/parcelas/', {
    params: {
      status,
      mes_referencia: mes,
      modalidade // ✅ CORRETO
    }
  });
},
  mesAtual: () => api.get('/parcelas/mes-atual'),
  atrasadas: () => api.get('/parcelas/atrasadas'),
  buscarPorId: (id: number) => api.get(`/parcelas/${id}`),
  pagar: (
    id: number,
    dados: { data_pagamento?: string; valor_pago?: number; observacao?: string }
  ) => api.post(`/parcelas/${id}/pagar`, dados),
  atualizar: (id: number, dados: any) => api.patch(`/parcelas/${id}`, dados),
  atualizarAtrasadas: () => api.post('/parcelas/atualizar-atrasadas'),


  baixar_lote: (ids: number[]) => api.post('/parcelas/baixar-lote', ids),

  baixar_consignado: (mes: string, modalidade: string) => {
  return api.post('/parcelas/baixar-consignado', null, {
    params: { mes, modalidade }
  });
}

};

// ─────────────── Dashboard ───────────────

export const DashboardService = {
  resumoGeral: () => api.get('/dashboard/resumo'),
  porModalidade: () => api.get('/dashboard/por-modalidade'),
  vencimentosProximos: (dias: number = 7) =>
    api.get('/dashboard/vencimentos-proximos', { params: { dias } }),
  evolucaoMensal: () => api.get('/dashboard/evolucao-mensal'),
  relatorioConsolidado: () => api.get('/dashboard/relatorio-consolidado'),
  previsaoRecebimentos: () => api.get('/dashboard/previsao-recebimentos'),
};



// ─────────────── Adiantamentos ───────────────

export interface AdiantamentoPayload {
  nota_fiscal: string;
  valor_enviado: number;
  valor_receber: number;
  data_enviada?: string;
  data_receber: string;
  status?: 'pendente' | 'recebido' | 'cancelado';
}

export interface AdiantamentoUpdate {
  nota_fiscal?: string;
  status?: 'pendente' | 'recebido' | 'cancelado';
  valor_enviado?: number;
  valor_receber?: number;
  data_enviada?: string;
  data_receber?: string;
}

export const AdiantamentoService = {
  listar: (status?: string, data_receber_ate?: string) =>
    api.get('/adiantamentos/', { params: { status, data_receber_ate } }),
  aReceber: () => api.get('/adiantamentos/a-receber'),
  resumo: () => api.get('/adiantamentos/resumo'),
  buscarPorId: (id: number) => api.get(`/adiantamentos/${id}`),
  criar: (dados: AdiantamentoPayload) => api.post('/adiantamentos/', dados),
  atualizar: (id: number, dados: AdiantamentoUpdate) => api.patch(`/adiantamentos/${id}`, dados),
  marcarRecebido: (id: number) => api.post(`/adiantamentos/${id}/receber`),
  cancelar: (id: number) => api.delete(`/adiantamentos/${id}`),
};


export const CCBService = {
  extrairDados: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post('api/api/extrair-ccb', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
