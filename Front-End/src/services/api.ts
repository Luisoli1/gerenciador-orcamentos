import axios from 'axios';
import type { Obra, Fornecedor, QuadroComparativoDto, Qc, OrcamentoSalvo, ItemVariacaoDto, ConflitoQcDto, FaturamentoDireto, Usuario, LoginRequest, LoginResponse, AuditoriaLog, Role, ItemCanonico, ItemAlias, VerificacaoConciliacaoResponse, ConversaoPadrao, ItemTreinamento, ValidarItemTreinamentoRequest, EstatisticasTreinamento, ItemQuadroDTO } from '../types';
import { salvarArquivo } from '../utils/fileDownloader';


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// Interceptor para injetar JWT Token em todas as requisições
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('makinsthal_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para capturar token expirado (401)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('makinsthal_token');
      localStorage.removeItem('makinsthal_user');
      window.dispatchEvent(new Event('auth_logout'));
    }
    return Promise.reject(error);
  }
);


export const api = {
  // --- OBRAS ---
  listarObras: async (): Promise<Obra[]> => {
    const res = await axios.get(`${API_BASE_URL}/obras`);
    return res.data;
  },

  buscarObraPorId: async (id: number): Promise<Obra> => {
    const res = await axios.get(`${API_BASE_URL}/obras/${id}`);
    return res.data;
  },

  criarObra: async (obra: Obra): Promise<Obra> => {
    const res = await axios.post(`${API_BASE_URL}/obras`, obra);
    return res.data;
  },

  atualizarObra: async (id: number, obra: Obra): Promise<Obra> => {
    const res = await axios.put(`${API_BASE_URL}/obras/${id}`, obra);
    return res.data;
  },

  deletarObra: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/obras/${id}`);
  },

  // --- FORNECEDORES ---
  listarFornecedores: async (): Promise<Fornecedor[]> => {
    const res = await axios.get(`${API_BASE_URL}/fornecedores`);
    return res.data;
  },

  buscarFornecedorPorId: async (id: number): Promise<Fornecedor> => {
    const res = await axios.get(`${API_BASE_URL}/fornecedores/${id}`);
    return res.data;
  },

  criarFornecedor: async (fornecedor: Fornecedor): Promise<Fornecedor> => {
    const res = await axios.post(`${API_BASE_URL}/fornecedores`, fornecedor);
    return res.data;
  },

  atualizarFornecedor: async (id: number, fornecedor: Fornecedor): Promise<Fornecedor> => {
    const res = await axios.put(`${API_BASE_URL}/fornecedores/${id}`, fornecedor);
    return res.data;
  },

  deletarFornecedor: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/fornecedores/${id}`);
  },

  // --- ORÇAMENTOS & PROCESSAMENTO IA ---
  listarOrcamentos: async (): Promise<OrcamentoSalvo[]> => {
    const response = await axios.get(`${API_BASE_URL}/orcamentos`);
    return response.data;
  },

  listarOrcamentosPorObra: async (obraId: number): Promise<OrcamentoSalvo[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/orcamentos/obra/${obraId}`);
      if (Array.isArray(response.data)) {
        return response.data;
      }
    } catch {
      // fallback
    }
    try {
      const all = await axios.get(`${API_BASE_URL}/orcamentos`);
      if (Array.isArray(all.data)) {
        return all.data.filter((o: any) => o.qc?.obra?.id === obraId || (o.qc && !o.qc.obra));
      }
    } catch {
      // ignore
    }
    return [];
  },

  uploadOrcamentos: async (obraId: number, files: File[], forceNew: boolean = false, numeroQc?: string): Promise<any> => {
    const formData = new FormData();
    formData.append('obraId', obraId.toString());
    formData.append('forceNew', forceNew.toString());
    if (numeroQc && numeroQc.trim().length > 0) {
      formData.append('numeroQc', numeroQc.trim());
    }
    files.forEach((file) => formData.append('files', file));

    const response = await axios.post(`${API_BASE_URL}/orcamentos/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    const data = response.data;
    // Se for retorno de conflito/duplicidade, retorna diretamente
    if (data && data.duplicado) {
      return data;
    }
    if (data && !data.orcamentos && data.nomeFornecedor) {
      return {
        metadados: {
          nomeObra: `Obra #${obraId}`,
          numeroQuadro: numeroQc || 'QC-001',
          dataElaboracao: new Date().toISOString().split('T')[0],
        },
        orcamentos: [data],
        fornecedorVencedor: data.nomeFornecedor,
        observacao: 'Orçamento único importado',
      };
    }
    return data;
  },

  analisarVariacao: async (file: File): Promise<ItemVariacaoDto[]> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_BASE_URL}/orcamentos/analisar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  downloadComparativoExcel: async (obraId: number, files: File[]) => {
    const formData = new FormData();
    formData.append('obraId', obraId.toString());
    files.forEach((file) => formData.append('files', file));

    const response = await axios.post(`${API_BASE_URL}/orcamentos/comparativo-excel`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      responseType: 'blob',
    });

    await salvarArquivo(new Blob([response.data]), `quadro_concorrencia_obra_${obraId}.xlsx`);
  },

  exportarExcelDireto: async (comparativo: QuadroComparativoDto, nomeArquivo?: string) => {
    const response = await axios.post(`${API_BASE_URL}/orcamentos/exportar-excel`, comparativo, {
      responseType: 'blob',
    });
    const nomeFinal = nomeArquivo
      ? (nomeArquivo.endsWith('.xlsx') ? nomeArquivo : `${nomeArquivo}.xlsx`)
      : `quadro_concorrencia_${comparativo.metadados?.numeroQuadro || Date.now()}.xlsx`;
    await salvarArquivo(new Blob([response.data]), nomeFinal);
  },

  deletarOrcamento: async (id: number) => {
    await axios.delete(`${API_BASE_URL}/orcamentos/${id}`);
  },

  // --- QC ---
  listarQcsPorObra: async (obraId: number): Promise<Qc[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/qc/obra/${obraId}`);
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
    } catch {
      // fallback
    }
    try {
      const allQcs = await axios.get(`${API_BASE_URL}/qc`);
      if (Array.isArray(allQcs.data)) {
        return allQcs.data.filter((q: any) => q.id && (q.obra?.id === obraId || !q.obra));
      }
    } catch {
      // ignore
    }
    return [];
  },

  listarQcs: async (): Promise<Qc[]> => {
    const response = await axios.get(`${API_BASE_URL}/qc`);
    return response.data;
  },

  buscarQcComparativo: async (id: number): Promise<QuadroComparativoDto> => {
    const response = await axios.get(`${API_BASE_URL}/qc/${id}/comparativo`);
    return response.data;
  },

  atualizarQc: async (id: number, qc: { numeroQuadro?: string; dataCriacao?: string }): Promise<Qc> => {
    const response = await axios.put(`${API_BASE_URL}/qc/${id}`, qc);
    return response.data;
  },

  atualizarComparativoCompleto: async (id: number, comparativo: QuadroComparativoDto): Promise<QuadroComparativoDto> => {
    const response = await axios.put(`${API_BASE_URL}/qc/${id}/comparativo`, comparativo);
    return response.data;
  },

  deletarQc: async (id: number) => {
    await axios.delete(`${API_BASE_URL}/qc/${id}`);
  },

  gerarQcVencedor: async (payload: {
    qcOriginalId: number;
    numeroQuadroVencedor: string;
    fornecedorNome: string;
    itensVencedores: Array<{
      marca?: string;
      descricao: string;
      unidadeMedida?: string;
      quantidade: number;
      valorUnitario: number;
      valorTotal: number;
      aliquotaIpi?: number;
    }>;
  }): Promise<Qc> => {
    const response = await axios.post(`${API_BASE_URL}/qc/gerar-vencedor`, payload);
    return response.data;
  },

  restaurarItemQc: async (qcId: number, dto: {
    item: string;
    fornecedor?: string;
    campo: string;
    valorAntigo: string;
    valorAtual: string;
  }): Promise<{ sucesso: boolean; mensagem: string }> => {
    const response = await axios.post(`${API_BASE_URL}/qc/${qcId}/restaurar-item`, dto);
    return response.data;
  },


  // --- FATURAMENTO DIRETO ---
  listarFaturamentosDiretos: async (obraId?: number): Promise<FaturamentoDireto[]> => {
    const url = obraId ? `${API_BASE_URL}/faturamento-direto?obraId=${obraId}` : `${API_BASE_URL}/faturamento-direto`;
    const res = await axios.get(url);
    return res.data;
  },

  buscarFaturamentoDiretoPorId: async (id: number): Promise<FaturamentoDireto> => {
    const res = await axios.get(`${API_BASE_URL}/faturamento-direto/${id}`);
    return res.data;
  },

  gerarFaturamentoDiretoDeQc: async (payload: {
    qcId: number;
    fornecedorNome: string;
    numeroControle?: string;
    dadosComplementares?: Partial<FaturamentoDireto>;
  }): Promise<FaturamentoDireto> => {
    const res = await axios.post(`${API_BASE_URL}/faturamento-direto/gerar-de-qc`, payload);
    return res.data;
  },

  salvarFaturamentoDireto: async (fd: FaturamentoDireto): Promise<FaturamentoDireto> => {
    const res = await axios.post(`${API_BASE_URL}/faturamento-direto`, fd);
    return res.data;
  },

  atualizarFaturamentoDireto: async (id: number, fd: FaturamentoDireto): Promise<FaturamentoDireto> => {
    const res = await axios.put(`${API_BASE_URL}/faturamento-direto/${id}`, fd);
    return res.data;
  },

  deletarFaturamentoDireto: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/faturamento-direto/${id}`);
  },

  downloadExcelFaturamentoDireto: async (id: number, numeroControle: string) => {
    const response = await axios.get(`${API_BASE_URL}/faturamento-direto/${id}/excel`, {
      responseType: 'blob',
    });
    await salvarArquivo(new Blob([response.data]), `Faturamento_Direto_${numeroControle || id}.xlsx`);
  },
  // --- AUTENTICAÇÃO ---
  login: async (req: LoginRequest): Promise<LoginResponse> => {
    const res = await axios.post(`${API_BASE_URL}/auth/login`, req);
    return res.data;
  },

  getMe: async (): Promise<Usuario> => {
    const res = await axios.get(`${API_BASE_URL}/auth/me`);
    return res.data;
  },

  // --- GESTÃO DE USUÁRIOS (DONO) ---
  listarUsuarios: async (): Promise<Usuario[]> => {
    const res = await axios.get(`${API_BASE_URL}/usuarios`);
    return res.data;
  },

  criarUsuario: async (usuario: { nome: string; email: string; senha?: string; role: Role }): Promise<Usuario> => {
    const res = await axios.post(`${API_BASE_URL}/usuarios`, usuario);
    return res.data;
  },

  atualizarUsuario: async (id: number, usuario: { nome: string; senha?: string; role?: Role }): Promise<Usuario> => {
    const res = await axios.put(`${API_BASE_URL}/usuarios/${id}`, usuario);
    return res.data;
  },

  alternarStatusUsuario: async (id: number): Promise<Usuario> => {
    const res = await axios.patch(`${API_BASE_URL}/usuarios/${id}/status`);
    return res.data;
  },

  deletarUsuario: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/usuarios/${id}`);
  },

  // --- AUDITORIA (DONO) ---
  listarAuditoria: async (busca?: string): Promise<AuditoriaLog[]> => {
    const url = busca ? `${API_BASE_URL}/auditoria?busca=${encodeURIComponent(busca)}` : `${API_BASE_URL}/auditoria`;
    const res = await axios.get(url);
    return res.data;
  },

  listarAuditoriaPorEntidade: async (entidade: string): Promise<AuditoriaLog[]> => {
    const res = await axios.get(`${API_BASE_URL}/auditoria/entidade/${entidade}`);
    return res.data;
  },

  // --- CONCILIAÇÃO & CADASTRO MESTRE (DE-PARA) ---
  listarAliases: async (filtro?: string): Promise<ItemAlias[]> => {
    const url = filtro ? `${API_BASE_URL}/conciliacao/aliases?filtro=${encodeURIComponent(filtro)}` : `${API_BASE_URL}/conciliacao/aliases`;
    const res = await axios.get(url);
    return res.data;
  },

  reassociarAlias: async (id: number, data: { novoItemCanonicoId?: number; novaDescricaoCanonico?: string; unidadePadrao?: string; categoria?: string }): Promise<ItemAlias> => {
    const res = await axios.put(`${API_BASE_URL}/conciliacao/aliases/${id}`, data);
    return res.data;
  },

  inativarAlias: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/conciliacao/aliases/${id}`);
  },

  listarMateriaisMestre: async (termo?: string): Promise<ItemCanonico[]> => {
    const url = termo ? `${API_BASE_URL}/conciliacao/materiais?termo=${encodeURIComponent(termo)}` : `${API_BASE_URL}/conciliacao/materiais`;
    const res = await axios.get(url);
    return res.data;
  },

  criarMaterialMestre: async (data: { descricaoPadrao: string; unidadePadrao: string; categoria?: string; codigoNcm?: string; codigoReferencia?: string }): Promise<ItemCanonico> => {
    const res = await axios.post(`${API_BASE_URL}/conciliacao/materiais`, data);
    return res.data;
  },

  verificarDiscrepancias: async (comparativo: QuadroComparativoDto): Promise<VerificacaoConciliacaoResponse> => {
    const res = await axios.post(`${API_BASE_URL}/conciliacao/verificar-discrepancias`, comparativo);
    return res.data;
  },

  confirmarConciliacoes: async (data: { qcId?: number; associacoes: any[] }): Promise<void> => {
    await axios.post(`${API_BASE_URL}/conciliacao/confirmar`, data);
  },

  listarConversoesPadrao: async (): Promise<ConversaoPadrao[]> => {
    const res = await axios.get(`${API_BASE_URL}/conciliacao/conversoes`);
    return res.data;
  },

  cadastrarConversaoItem: async (id: number, data: { unidadeOrigem: string; unidadeDestino: string; fatorMultiplicador: number }): Promise<any> => {
    const res = await axios.post(`${API_BASE_URL}/conciliacao/materiais/${id}/conversoes`, data);
    return res.data;
  },

  // --- TREINAMENTO DA BASE DE CONHECIMENTO (MODO VALIDAÇÃO EM MASSA) ---
  obterProximoItemTreinamento: async (): Promise<ItemTreinamento | null> => {
    const res = await axios.get(`${API_BASE_URL}/conciliacao/treinamento/proximo`);
    if (res.status === 204 || !res.data) return null;
    return res.data;
  },

  validarItemTreinamento: async (data: ValidarItemTreinamentoRequest): Promise<ItemTreinamento | null> => {
    const res = await axios.post(`${API_BASE_URL}/conciliacao/treinamento/validar`, data);
    if (res.status === 204 || !res.data) return null;
    return res.data;
  },

  obterEstatisticasTreinamento: async (): Promise<EstatisticasTreinamento> => {
    const res = await axios.get(`${API_BASE_URL}/conciliacao/treinamento/estatisticas`);
    return res.data;
  },

  enfileirarItensTreinamento: async (itens: ItemQuadroDTO[], fornecedor?: string, documento?: string, tipoFonte?: string): Promise<number> => {
    const params = new URLSearchParams();
    if (fornecedor) params.append('fornecedor', fornecedor);
    if (documento) params.append('documento', documento);
    if (tipoFonte) params.append('tipoFonte', tipoFonte);

    const res = await axios.post(`${API_BASE_URL}/conciliacao/treinamento/enfileirar?${params.toString()}`, itens);
    return res.data;
  },
};

export default api;
