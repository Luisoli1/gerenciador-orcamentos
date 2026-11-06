export type AIStatus = "processed" | "review" | "pending" | "failed";

export interface SupplierQuote {
  supplier: string;
  price: number;
}

export interface QCItem {
  id: string;
  code: string;
  description: string;
  unit: string;
  quantity: number;
  bestPrice: number;
  bestSupplier: string;
  quotes: SupplierQuote[];
  aiStatus: AIStatus;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  supplier: string;
  uploadedAt: Date;
}

export type VariationTrend = "up" | "down" | "stable";

export interface VariationRecord {
  id: string;
  date: Date;
  supplier: string;
  price: number;
}

export interface VariationItem {
  id: string;
  code: string;
  description: string;
  unit: string;
  currentPrice: number;
  previousPrice: number;
  variation: number;
  variationPercent: number;
  trend: VariationTrend;
  history: VariationRecord[];
  alert: boolean;
}

export type ViewKey = "qc" | "variation" | "obras" | "fornecedores" | "faturamento" | "catalogo" | "auditoria" | "usuarios";

// --- DTOs integrados com Spring Boot ---

export interface QuadroMetaDadosDto {
  nomeObra?: string;
  numeroQuadro?: string;
  nomeCliente?: string;
  cnpjCliente?: string;
  dataElaboracao?: string;
}

export interface ItemQuadroDTO {
  marca?: string;
  descricao: string;
  unidadeMedida?: string;
  quantidade?: number;
  valorUnitario?: number;
  valorTotal?: number;
  aliquotaIpi?: number;
}

export interface QuadroConcorrenciaDto {
  nomeFornecedor: string;
  cnpjFornecedor?: string;
  nomeContato?: string;
  telefoneContato?: string;
  celularContato?: string;
  emailContato?: string;
  numeroOrcamento?: string;
  localCidade?: string;
  dataEmissao?: string;
  dataValidade?: string;
  valorTotalGeral?: number;
  valorTotalMercadoria?: number;
  valorTotalIpi?: number;
  itens: ItemQuadroDTO[];
}

export interface QuadroComparativoDto {
  metadados?: QuadroMetaDadosDto;
  orcamentos: QuadroConcorrenciaDto[];
  fornecedorVencedor?: string;
  observacao?: string;
  duplicado?: boolean;
}

export interface ConflitoQcDto {
  duplicado: boolean;
  qcId: number;
  numeroQuadro: string;
  dataQc: string;
  numeroOrcamento: string;
  nomeFornecedor: string;
  mensagem: string;
}

export interface EngenheiroObra {
  id?: number;
  nome: string;
  email: string;
  principal: boolean;
}

export interface Obra {
  id?: number;
  nomeObra: string;
  nomeCliente: string;
  cnpjCliente: string;
  enderecoObra?: string;
  cepObra?: string;
  telefoneCliente?: string;
  emailCliente?: string;
  contatoCliente?: string;
  enderecoEntrega?: string;
  cepEntrega?: string;
  telefoneEntrega?: string;
  emailEntrega?: string;
  contatoEntrega?: string;
  numeroContrato?: string;
  engenheiros?: EngenheiroObra[];
}

export interface Fornecedor {
  id?: number;
  nome: string;
  cnpj?: string;
  nomeContato?: string;
  emailContato?: string;
  telefoneContato?: string;
  celularContato?: string;
  localCidade?: string;
  endereco?: string;
  cep?: string;
}

export interface Qc {
  id: number;
  numeroQuadro: string;
  dataCriacao: string;
  obra?: Obra;
}

export interface OrcamentoSalvo {
  id: number;
  numeroOrcamento: string;
  dataEmissao: string;
  dataValidade?: string;
  valorTotal: number;
  valorTotalMercadoria?: number;
  valorTotalIpi?: number;
  fornecedor?: Fornecedor;
  itens?: Array<{
    id?: number;
    descricao: string;
    marca?: string;
    unidadeDeMedida?: string;
    quantidade?: number;
    valorUnitario?: number;
    valorTotal?: number;
    aliquotaIpi?: number;
  }>;
}

export interface ConsolidatedQuote {
  fornecedorNome: string;
  valorUnitario: number | null;
  valorTotal: number | null;
  valorUnitarioOriginal?: number | null;
  quantidadeOriginal?: number | null;
  unidadeOriginal?: string;
  fatorConversao?: number;
  isQuantidadeDivergente?: boolean;
  quantidadeDivergenteTexto?: string;
  marca?: string;
  chapa?: string;
  descricaoOriginal?: string;
  isMelhorUnitario: boolean;
  isMelhorTotal: boolean;
}

export interface ConsolidatedItem {
  itemSeq: number;
  descricao: string;
  unidadeMedida: string;
  quantidade: number;
  quotes: ConsolidatedQuote[];
  melhorUnitario: number | null;
  melhorTotal: number | null;
}

export interface ItemVariacaoDto {
  nomeFornecedor: string;
  nomeContato?: string;
  descricaoItem: string;
  precoAtual: number;
  precoAnterior: number;
  numeroOrcamentoAnterior: string;
  dataEmissaoAnterior: string;
  percentualVariacao: number;
}

export interface ItemFaturamentoDireto {
  id?: number;
  itemSeq?: number;
  descricao: string;
  unidade: string;
  quantidade: number;
  precoUnitario: number;
  valorTotal: number;
}

export interface FaturamentoDireto {
  id?: number;
  numeroControle: string;
  dataElaboracao?: string;
  revisao?: string;
  contratoDe?: string;
  numeroContrato?: string;
  observacoes?: string;
  fornecedorCadastrado?: boolean;
  fornecedorVinculado?: boolean;
  saldoOk?: boolean;

  obra?: Obra;
  fornecedor?: Fornecedor;
  qc?: Qc;

  fornecedorNome?: string;
  fornecedorEndereco?: string;
  fornecedorCep?: string;
  fornecedorCnpj?: string;
  fornecedorTelefone?: string;
  fornecedorEmail?: string;
  fornecedorContato?: string;

  clienteEmpresa?: string;
  clienteEndereco?: string;
  clienteCep?: string;
  clienteCnpj?: string;
  clienteTelefone?: string;
  clienteEmail?: string;
  clienteContato?: string;

  contratadaEmpresa?: string;
  contratadaEndereco?: string;
  contratadaCep?: string;
  contratadaCnpj?: string;
  contratadaTelefone?: string;
  contratadaEmail?: string;
  contratadaContato?: string;

  entregaObra?: string;
  entregaEndereco?: string;
  entregaCep?: string;
  entregaCnpj?: string;
  entregaTelefone?: string;
  entregaEmail?: string;
  entregaContato?: string;

  valorTotalGeral?: number;
  itens?: ItemFaturamentoDireto[];
}

// --- AUTH & AUDITORIA ---
export type Role = 'DONO' | 'OPERADOR';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  role: Role;
  ativo: boolean;
  dataCriacao: string;
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  token: string;
  id: number;
  nome: string;
  email: string;
  role: Role;
}

export interface DiffItem {
  item: string;
  fornecedor?: string;
  campo: string;
  antes: string;
  depois: string;
}

export interface AuditoriaLog {
  diffJson?: string;
  id: number;
  dataHora: string;
  usuarioEmail: string;
  usuarioNome: string;
  acao: 'CRIACAO' | 'ATUALIZACAO' | 'EXCLUSAO' | 'LOGIN' | string;
  entidade: 'FORNECEDOR' | 'QC' | 'FATURAMENTO_DIRETO' | 'OBRA' | 'USUARIO' | string;
  idRegistro?: string;
  detalhes: string;
}

// --- CONCILIAÇÃO & CADASTRO MESTRE DE MATERIAIS ---

export interface ItemCanonico {
  id: number;
  codigoReferencia?: string;
  codigoNcm?: string;
  descricaoPadrao: string;
  descricaoNormalizada: string;
  unidadePadrao: string;
  categoria?: string;
  subcategoria?: string;
  aplicacoes?: string;
  caracteristicas?: string;
  ativo: boolean;
  criadoPor?: string;
  dataCriacao?: string;
}

export interface ItemAlias {
  id: number;
  descricaoOriginal: string;
  descricaoNormalizada: string;
  origem: string;
  vezesUtilizado: number;
  fornecedorId?: number;
  fornecedorNome?: string;
  itemCanonicoId: number;
  itemCanonicoDescricao: string;
  itemCanonicoUnidade: string;
  criadoPorNome?: string;
  dataCriacao?: string;
  alteradoPorNome?: string;
  dataAtualizacao?: string;
}

export interface EvidenciaSinal {
  tipo: string;
  titulo: string;
  detalhe: string;
  peso: number;
  favoravel: boolean;
}

export interface SugestaoConciliacao {
  itemDescricaoOriginal: string;
  fornecedorNome: string;
  fornecedorId?: number;
  itemCanonicoSugeridoId?: number;
  itemCanonicoSugeridoDescricao?: string;
  confianca: number;
  justificativa: string;
  origemSugestao: string;
  unidadeOriginal?: string;
  unidadeCanonico?: string;
  fatorConversao?: number;
  quantidadeOriginal?: number;
  quantidadeConvertida?: number;
  precoUnitarioOriginal?: number;
  precoUnitarioConvertido?: number;
  alertaEspecificacao?: string;
  motivos?: string[];
  evidencias?: EvidenciaSinal[];
}

export interface DiscrepanciaItem {
  descricaoItem: string;
  fornecedorPresente: string;
  fornecedoresFaltantes: string[];
  possiveisEquivalentes: SugestaoConciliacao[];
}

export interface VerificacaoConciliacaoResponse {
  possuiDiscrepancia: boolean;
  totalLinhasQc: number;
  maiorOrcamentoLinhas: number;
  menorOrcamentoLinhas: number;
  mensagemAlerta: string;
  sugestoes: SugestaoConciliacao[];
  discrepancias: DiscrepanciaItem[];
}

export interface ConversaoPadrao {
  id: number;
  unidadeOrigem: string;
  unidadeDestino: string;
  fatorMultiplicador: number;
  descricaoRegra?: string;
  ativo?: boolean;
}

// --- FILA DE TREINAMENTO & VALIDAÇÃO EM MASSA ---

export interface SugestaoItemTreinamento {
  itemCanonicoId: number;
  descricaoPadrao: string;
  unidadePadrao: string;
  categoria?: string;
  subcategoria?: string;
  aplicacoes?: string[];
  caracteristicas?: string[];
  confianca: number;
  justificativa: string;
  avisoDivergenciaTecnica?: string;
  motivos?: string[];
  evidencias?: EvidenciaSinal[];
  origem?: string;
}

export interface ItemTreinamento {
  id: number;
  descricaoBruta: string;
  unidadeBruta?: string;
  fornecedorOrigem?: string;
  documentoOrigem?: string;
  tipoFonte: string;
  status: string;
  categoriaSugerida?: string;
  subcategoriaSugerida?: string;
  aplicacoesSugeridas?: string[];
  caracteristicasSugeridas?: string[];
  fabricanteSugerido?: string;
  codigoFabricanteSugerido?: string;
  sugestoes: SugestaoItemTreinamento[];
}

export interface ValidarItemTreinamentoRequest {
  itemTreinamentoId: number;
  acao: 'VINCULAR_EXISTENTE' | 'CRIAR_NOVO' | 'IGNORAR';
  itemCanonicoId?: number;
  novaDescricaoCanonico?: string;
  unidadePadrao?: string;
  categoria?: string;
  subcategoria?: string;
  aplicacoes?: string;
  caracteristicas?: string;
  codigoNcm?: string;
  cadastrarConversao?: boolean;
  fatorConversao?: number;
}

export interface RegraAtributoBloqueante {
  categoria: string;
  descricao: string;
  atributosBloqueantes: string[];
  exemplosValores: string[];
  impactoBloqueio: string;
}

export interface ClassificacaoTecnica {
  categoria: string;
  subcategoria?: string;
  aplicacoes: string[];
  caracteristicas: string[];
  fabricante?: string;
  codigoFabricante?: string;
  unidadeSugerida: string;
}

export interface UploadPdfTreinamentoResponse {
  totalArquivosProcessados: number;
  totalItensExtraidos: number;
  totalNovosEnfileirados: number;
  arquivos: string[];
  mensagem: string;
  erros?: string[];
}

export interface EstatisticasTreinamento {
  totalPendentes: number;
  totalValidados: number;
  totalIgnorados: number;
  totalGeral: number;
  percentualConcluido: number;
}


