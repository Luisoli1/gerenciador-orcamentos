import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../services/api';
import type { QuadroComparativoDto, Qc, QuadroConcorrenciaDto, ConflitoQcDto, ItemQuadroDTO } from '../types';
import { consolidateQuadro, areItemsEquivalent } from '../utils/qcMatcher';
import { 
  Upload, 
  FileSpreadsheet, 
  AlertCircle, 
  Layers, 
  Search, 
  Trophy, 
  Sparkles, 
  Paperclip, 
  Scale, 
  FileText, 
  CheckCircle2, 
  Database, 
  RefreshCw, 
  Mail, 
  Copy, 
  Check, 
  X, 
  ExternalLink,
  MessageCircle,
  TrendingDown,
  AlertTriangle,
  FolderOpen,
  Plus,
  FileCheck,
  Pencil,
  Hash,
  Calendar,
  Save,
  RotateCcw,
  Download,
  Loader2,
  Eye,
  ArrowLeft,
  ReceiptText,
  Trash2
} from 'lucide-react';

interface QCViewProps {
  obraId: number;
  initialQcId?: number | null;
  initialQcData?: QuadroComparativoDto | null;
  onClearInitialQc?: () => void;
}

interface ItemPerdedor {
  itemSeq: number;
  descricao: string;
  unidadeMedida: string;
  quantidade: number;
  meuPrecoUnitario: number;
  meuPrecoTotal: number;
  melhorPrecoUnitario: number;
  melhorPrecoTotal: number;
  diffUnit: number;
  diffTotal: number;
}

interface ItemVencedor {
  itemSeq: number;
  descricao: string;
  unidadeMedida: string;
  quantidade: number;
  precoUnitario: number;
  precoTotal: number;
}

interface NegociacaoModalState {
  orc: QuadroConcorrenciaDto;
  itens: ItemPerdedor[];
  assunto: string;
  emailTexto: string;
}

interface VencedoresModalState {
  orc: QuadroConcorrenciaDto;
  itensVencedores: ItemVencedor[];
  itensPerdedores: ItemPerdedor[];
  assunto: string;
  emailTexto: string;
  gerarQc: boolean;
  numeroQcVencedor: string;
  gerandoQc: boolean;
  qcGeradoSucesso: boolean;
  novoQcCriadoId?: number;

  gerarFd: boolean;
  tipoNumeroFd: 'sequencial' | 'manual';
  proximoFdSequencial: string;
  numeroFdManual: string;
  gerandoFd: boolean;
  fdGeradoSucesso: boolean;
  novoFdCriadoId?: number;
}

export function QCView({ obraId, initialQcId, initialQcData, onClearInitialQc }: QCViewProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [qcData, setQcData] = useState<QuadroComparativoDto | null>(initialQcData || null);
  const [error, setError] = useState<string | null>(null);
  const [sucessoQc, setSucessoQc] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Lista de QCs salvos para esta obra
  const [qcsDaObra, setQcsDaObra] = useState<Qc[]>([]);
  const [selectedQcId, setSelectedQcId] = useState<number | null>(initialQcId || null);
  const [carregandoQc, setCarregandoQc] = useState<boolean>(false);

  // MODO DE EDIÇÃO INLINE DO QUADRO COMPARATIVO E ORÇAMENTOS
  const [modoEdicao, setModoEdicao] = useState<boolean>(false);
  const [qcEditavel, setQcEditavel] = useState<QuadroComparativoDto | null>(null);
  const [salvandoEdicao, setSalvandoEdicao] = useState<boolean>(false);

  // Modal de Negociação de Itens Perdedores
  const [negociacaoModal, setNegociacaoModal] = useState<NegociacaoModalState | null>(null);
  const [copiadoNegociacao, setCopiadoNegociacao] = useState(false);

  // Modal de Fechamento de Itens Vencedores (Exclusão dos demais)
  const [vencedoresModal, setVencedoresModal] = useState<VencedoresModalState | null>(null);
  const [copiadoVencedores, setCopiadoVencedores] = useState(false);

  // Modal de Validação de Orçamento em outro QC
  const [conflitoModal, setConflitoModal] = useState<ConflitoQcDto | null>(null);
  const [acaoPendente, setAcaoPendente] = useState<'visualizar' | 'excel'>('visualizar');

  // Modal de Escolha de Número ao Gerar QC (Sequencial vs Personalizado)
  const [modalDefinirQcAberto, setModalDefinirQcAberto] = useState<boolean>(false);
  const [tipoNumeroQc, setTipoNumeroQc] = useState<'sequencial' | 'manual'>('sequencial');
  const [numeroQcManual, setNumeroQcManual] = useState<string>('');
  const [acaoPendenteGeracao, setAcaoPendenteGeracao] = useState<'visualizar' | 'excel'>('visualizar');

  // Modal de Exclusão de QC
  const [modalExcluirQcAberto, setModalExcluirQcAberto] = useState<boolean>(false);
  const [qcParaExcluir, setQcParaExcluir] = useState<{ id: number; numero: string } | null>(null);
  const [excluindoQc, setExcluindoQc] = useState<boolean>(false);

  // Dados do QC ativos: se estiver em edição, usa qcEditavel; caso contrário, qcData
  const activeQc = modoEdicao && qcEditavel ? qcEditavel : qcData;

  const currentBaseNumero = activeQc?.metadados?.numeroQuadro || '';

  // Identifica todos os QCs que foram gerados exclusivamente com itens vencedores a partir deste QC
  const qcsVencedoresVinculados = useMemo(() => {
    if (!currentBaseNumero || !qcsDaObra) return [];
    const prefixo = `${currentBaseNumero}-`.toUpperCase();
    return qcsDaObra.filter(q =>
      q.numeroQuadro &&
      q.id !== activeQc?.metadados?.id &&
      q.numeroQuadro.toUpperCase().startsWith(prefixo)
    );
  }, [currentBaseNumero, qcsDaObra, activeQc?.metadados?.id]);

  // Se o QC atual for ele mesmo um QC derivado (ex: QC-032-ELECON), detecta o QC pai
  const partesNumeroAtual = currentBaseNumero.split('-');
  const isQcDerivado = partesNumeroAtual.length >= 3;
  const numeroQcPai = isQcDerivado ? partesNumeroAtual.slice(0, 2).join('-') : null;
  const qcPai = useMemo(() => {
    if (!numeroQcPai || !qcsDaObra) return null;
    return qcsDaObra.find(q => q.numeroQuadro?.toUpperCase() === numeroQcPai.toUpperCase()) || null;
  }, [numeroQcPai, qcsDaObra]);

  // Filtra apenas QCs principais para o menu seletor (oculta os derivados/vencedores como QC-032-ELECON)
  const qcsPrincipais = useMemo(() => {
    return qcsDaObra.filter(q => {
      if (!q.numeroQuadro) return false;
      const num = q.numeroQuadro.trim().toUpperCase();
      const partes = num.split('-');
      if (partes.length >= 3) return false;
      if (qcsDaObra.some(outro => outro.id !== q.id && outro.numeroQuadro && num.startsWith(`${outro.numeroQuadro.trim().toUpperCase()}-`))) {
        return false;
      }
      return true;
    });
  }, [qcsDaObra]);

  // Carregar lista de QCs salvos quando a obraId mudar
  const carregarQcsDaObra = async () => {
    try {
      const lista = await api.listarQcsPorObra(obraId);
      setQcsDaObra(Array.isArray(lista) ? lista : []);
    } catch (err) {
      console.error("Erro ao listar QCs da obra:", err);
    }
  };

  useEffect(() => {
    carregarQcsDaObra();
  }, [obraId]);

  useEffect(() => {
    if (initialQcData) {
      setQcData(initialQcData);
    }
    if (initialQcId) {
      setSelectedQcId(initialQcId);
    }
  }, [initialQcData, initialQcId]);

  useEffect(() => {
    if (initialQcId && !initialQcData) {
      handleCarregarQc(initialQcId);
    }
  }, [initialQcId]);

  // Cálculo automático do próximo número de sequência de QC
  const proximoSequencialCalculado = useMemo(() => {
    let maxNum = 0;
    qcsDaObra.forEach(q => {
      if (q.numeroQuadro) {
        const match = q.numeroQuadro.match(/\d+/);
        if (match) {
          const val = parseInt(match[0], 10);
          if (val > maxNum) maxNum = val;
        }
      }
    });
    const proximo = maxNum + 1;
    return `QC-${String(proximo).padStart(3, '0')}`;
  }, [qcsDaObra]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
      setConflitoModal(null);
    }
  };

  const handleAbrirModalExcluirQc = (qcId?: number | null, qcNumero?: string) => {
    if (!qcId) return;
    const num = qcNumero || activeQc?.metadados?.numeroQuadro || `QC #${qcId}`;
    setQcParaExcluir({ id: qcId, numero: num });
    setModalExcluirQcAberto(true);
  };

  const handleConfirmarExclusaoQc = async () => {
    if (!qcParaExcluir) return;
    setExcluindoQc(true);
    try {
      await api.deletarQc(qcParaExcluir.id);

      // Se o QC excluído era o que estava aberto na tela, reseta a visualização
      if (selectedQcId === qcParaExcluir.id || activeQc?.metadados?.id === qcParaExcluir.id) {
        setSelectedQcId(null);
        setQcData(null);
        setQcEditavel(null);
        setModoEdicao(false);
      }

      await carregarQcsDaObra();
      setSucessoQc(`QC ${qcParaExcluir.numero} excluído com sucesso! Numeração atualizada.`);
      setModalExcluirQcAberto(false);
      setQcParaExcluir(null);
    } catch (err: any) {
      console.error("Erro ao excluir QC:", err);
      alert("Erro ao excluir QC: " + (err.response?.data?.message || err.message));
    } finally {
      setExcluindoQc(false);
    }
  };

  // Disparo com abertura de pop-up para definir o número do QC
  const handleIniciarGeracao = (acao: 'visualizar' | 'excel') => {
    if (files.length === 0) return;
    setAcaoPendenteGeracao(acao);
    setTipoNumeroQc('sequencial');
    setNumeroQcManual(proximoSequencialCalculado);
    setModalDefinirQcAberto(true);
  };

  // Confirmar geração a partir do pop-up
  const handleConfirmarGeracaoComNumero = () => {
    setModalDefinirQcAberto(false);
    const numeroEscolhido = tipoNumeroQc === 'sequencial'
      ? proximoSequencialCalculado
      : (numeroQcManual.trim() || proximoSequencialCalculado);
    handleProcessarOrcamentos(acaoPendenteGeracao, false, numeroEscolhido);
  };

  // Processamento unificado para Visualizar na Tela ou Exportar Excel com validação prévia de conflito
  const handleProcessarOrcamentos = async (acao: 'visualizar' | 'excel', forceNew: boolean = false, numeroQcParam?: string) => {
    if (files.length === 0) return;
    setLoading(true);
    setError(null);
    setAcaoPendente(acao);

    try {
      const resultado = await api.uploadOrcamentos(obraId, files, forceNew, numeroQcParam);
      if (resultado && resultado.duplicado) {
        setConflitoModal(resultado as ConflitoQcDto);
        setLoading(false);
        return;
      }

      setQcData(resultado);
      setModoEdicao(false);
      setQcEditavel(null);
      setConflitoModal(null);
      await carregarQcsDaObra();

      // Identifica e vincula o ID do QC recém gerado
      const numGerado = resultado?.metadados?.numeroQuadro || numeroQcParam;
      if (numGerado) {
        const novaLista = await api.listarQcsPorObra(obraId);
        const achado = novaLista.find(q => q.numeroQuadro === numGerado);
        if (achado) setSelectedQcId(achado.id);
      }

      if (acao === 'excel') {
        try {
          await api.exportarExcelDireto(resultado);
        } catch (excelErr) {
          console.error("Erro ao baixar Excel:", excelErr);
        }
      }
    } catch (err: any) {
      console.error("Erro ao processar PDFs:", err);
      setError(err?.response?.data?.message || "Erro ao processar os orçamentos no backend. Verifique os arquivos.");
    } finally {
      setLoading(false);
    }
  };

  const handleCarregarQc = async (qcId: number) => {
    if (!qcId) {
      setSelectedQcId(null);
      return;
    }
    setSelectedQcId(qcId);
    setCarregandoQc(true);
    setError(null);
    setModoEdicao(false);
    setQcEditavel(null);
    try {
      const comparativo = await api.buscarQcComparativo(qcId);
      setQcData(comparativo);
    } catch (err: any) {
      console.error("Erro ao carregar QC montado:", err);
      setError("Não foi possível carregar o Quadro Comparativo selecionado.");
    } finally {
      setCarregandoQc(false);
    }
  };

  const handleExportExcel = async () => {
    if (files.length > 0) {
      handleIniciarGeracao('excel');
    } else if (activeQc) {
      try {
        await api.exportarExcelDireto(activeQc);
      } catch (err) {
        console.error("Erro ao exportar Excel direto:", err);
      }
    }
  };

  const handleLimparQC = () => {
    setQcData(null);
    setQcEditavel(null);
    setModoEdicao(false);
    setSelectedQcId(null);
    setFiles([]);
    setConflitoModal(null);
    if (onClearInitialQc) onClearInitialQc();
  };

  // --- LÓGICA DE EDIÇÃO INLINE DO QC E ORÇAMENTOS ---

  // Habilitar modo de edição (torna todos os campos editáveis)
  const handleIniciarEdicaoQc = () => {
    if (!qcData) return;
    setQcEditavel(JSON.parse(JSON.stringify(qcData)));
    setModoEdicao(true);
    setError(null);
  };

  // Cancelar modo de edição
  const handleCancelarEdicaoQc = () => {
    setQcEditavel(null);
    setModoEdicao(false);
  };

  // Recalcular totais e vencedor após qualquer edição
  const recalcularTotaisDoQc = (qcAtual: QuadroComparativoDto): QuadroComparativoDto => {
    let menorTotalGeral: number | null = null;
    let fornecedorVencedor = qcAtual.fornecedorVencedor || '';

    (qcAtual.orcamentos || []).forEach(orc => {
      let totalMerc = 0;
      (orc.itens || []).forEach(item => {
        const qtd = Number(item.quantidade) || 0;
        const vu = Number(item.valorUnitario) || 0;
        item.valorTotal = qtd * vu;
        totalMerc += item.valorTotal;
      });

      orc.valorTotalMercadoria = totalMerc;
      orc.valorTotalGeral = totalMerc + (Number(orc.valorTotalIpi) || 0);

      if (orc.valorTotalGeral > 0) {
        if (menorTotalGeral === null || orc.valorTotalGeral < menorTotalGeral) {
          menorTotalGeral = orc.valorTotalGeral;
          fornecedorVencedor = orc.nomeFornecedor;
        }
      }
    });

    qcAtual.fornecedorVencedor = fornecedorVencedor;
    return { ...qcAtual };
  };

  // Alterar Preço Unitário de um Item para um Fornecedor Específico
  const handleAlterarPrecoUnitario = (itemDesc: string, fornecedorNome: string, novoUnit: number) => {
    if (!qcEditavel) return;
    const clone: QuadroComparativoDto = JSON.parse(JSON.stringify(qcEditavel));

    const orc = (clone.orcamentos || []).find(o => o.nomeFornecedor === fornecedorNome);
    if (orc) {
      let item = (orc.itens || []).find(i => areItemsEquivalent(i.descricao, itemDesc));
      if (!item) {
        item = {
          descricao: itemDesc,
          unidadeMedida: 'PÇ',
          quantidade: 1,
          valorUnitario: novoUnit,
          valorTotal: novoUnit,
          marca: ''
        };
        orc.itens.push(item);
      } else {
        item.valorUnitario = novoUnit;
      }
    }

    setQcEditavel(recalcularTotaisDoQc(clone));
  };

  // Alterar Marca de um Item para um Fornecedor
  const handleAlterarMarca = (itemDesc: string, fornecedorNome: string, novaMarca: string) => {
    if (!qcEditavel) return;
    const clone: QuadroComparativoDto = JSON.parse(JSON.stringify(qcEditavel));

    const orc = (clone.orcamentos || []).find(o => o.nomeFornecedor === fornecedorNome);
    if (orc) {
      const item = (orc.itens || []).find(i => areItemsEquivalent(i.descricao, itemDesc));
      if (item) {
        item.marca = novaMarca;
      }
    }

    setQcEditavel(recalcularTotaisDoQc(clone));
  };

  // Alterar Quantidade de um Item (reflete em todos os fornecedores)
  const handleAlterarQuantidade = (itemDesc: string, novaQtd: number) => {
    if (!qcEditavel) return;
    const clone: QuadroComparativoDto = JSON.parse(JSON.stringify(qcEditavel));

    (clone.orcamentos || []).forEach(orc => {
      const item = (orc.itens || []).find(i => areItemsEquivalent(i.descricao, itemDesc));
      if (item) {
        item.quantidade = novaQtd;
      }
    });

    setQcEditavel(recalcularTotaisDoQc(clone));
  };

  // Alterar Descrição de um Material (reflete em todos os fornecedores)
  const handleAlterarDescricao = (itemDescAntiga: string, novaDesc: string) => {
    if (!qcEditavel) return;
    const clone: QuadroComparativoDto = JSON.parse(JSON.stringify(qcEditavel));

    (clone.orcamentos || []).forEach(orc => {
      const item = (orc.itens || []).find(i => areItemsEquivalent(i.descricao, itemDescAntiga));
      if (item) {
        item.descricao = novaDesc;
      }
    });

    setQcEditavel(recalcularTotaisDoQc(clone));
  };

  // Alterar Unidade de Medida (reflete em todos os fornecedores)
  const handleAlterarUnidade = (itemDesc: string, novaUnd: string) => {
    if (!qcEditavel) return;
    const clone: QuadroComparativoDto = JSON.parse(JSON.stringify(qcEditavel));

    (clone.orcamentos || []).forEach(orc => {
      const item = (orc.itens || []).find(i => areItemsEquivalent(i.descricao, itemDesc));
      if (item) {
        item.unidadeMedida = novaUnd;
      }
    });

    setQcEditavel(recalcularTotaisDoQc(clone));
  };

  // Alterar Número do Orçamento de um Fornecedor
  const handleAlterarNumeroOrcamento = (fornecedorNome: string, novoNum: string) => {
    if (!qcEditavel) return;
    const clone: QuadroComparativoDto = JSON.parse(JSON.stringify(qcEditavel));
    const orc = (clone.orcamentos || []).find(o => o.nomeFornecedor === fornecedorNome);
    if (orc) {
      orc.numeroOrcamento = novoNum;
    }
    setQcEditavel({ ...clone });
  };

  // Alterar Nome do Vendedor / Contato de um Fornecedor
  const handleAlterarContatoFornecedor = (fornecedorNome: string, novoContato: string) => {
    if (!qcEditavel) return;
    const clone: QuadroComparativoDto = JSON.parse(JSON.stringify(qcEditavel));
    const orc = (clone.orcamentos || []).find(o => o.nomeFornecedor === fornecedorNome);
    if (orc) {
      orc.nomeContato = novoContato;
    }
    setQcEditavel({ ...clone });
  };

  // Alterar Metadados do QC (Número do QC ou Data)
  const handleAlterarMetadado = (campo: 'numeroQuadro' | 'dataElaboracao', valor: string) => {
    if (!qcEditavel) return;
    const clone: QuadroComparativoDto = JSON.parse(JSON.stringify(qcEditavel));
    if (!clone.metadados) clone.metadados = {};
    clone.metadados[campo] = valor;
    setQcEditavel({ ...clone });
  };

  // Salvar alterações completas no backend
  const handleSalvarEdicaoQc = async () => {
    if (!qcEditavel) return;
    setSalvandoEdicao(true);
    setError(null);

    let targetId = selectedQcId;
    if (!targetId && qcEditavel.metadados?.numeroQuadro) {
      const numBuscado = qcEditavel.metadados.numeroQuadro.trim();
      const numDigitos = numBuscado.replace(/\D/g, '');
      const qcFound = qcsDaObra.find(q => {
        if (!q.numeroQuadro) return false;
        if (q.numeroQuadro.trim().toLowerCase() === numBuscado.toLowerCase()) return true;
        const qDigitos = q.numeroQuadro.replace(/\D/g, '');
        return numDigitos && qDigitos && parseInt(qDigitos, 10) === parseInt(numDigitos, 10);
      });
      if (qcFound) targetId = qcFound.id;
    }

    // Se ainda não achou targetId e há apenas 1 QC na obra
    if (!targetId && qcsDaObra.length === 1) {
      targetId = qcsDaObra[0].id;
    }

    if (!targetId) {
      setError("Identificador do QC não localizado. Por favor, selecione o QC no seletor 'QC da Obra' antes de salvar.");
      setSalvandoEdicao(false);
      return;
    }

    try {
      const resultadoSalvo = await api.atualizarComparativoCompleto(targetId, qcEditavel);
      setQcData(resultadoSalvo);
      setSelectedQcId(targetId);
      setQcEditavel(null);
      setModoEdicao(false);
      setSucessoQc("Quadro Comparativo, itens e quantidades atualizados com sucesso no banco de dados!");
      setTimeout(() => setSucessoQc(null), 5000);
      await carregarQcsDaObra();
    } catch (err: any) {
      console.error("Erro ao salvar edições do QC:", err);
      setError(err?.response?.data?.message || "Erro ao salvar as alterações do QC no banco de dados.");
    } finally {
      setSalvandoEdicao(false);
    }
  };

  // Consolidação dinâmica de todos os itens cruzados entre os fornecedores
  const consolidatedItems = useMemo(() => {
    if (!activeQc || !activeQc.orcamentos) return [];
    return consolidateQuadro(activeQc.orcamentos);
  }, [activeQc]);

  // Filtro de materiais em tempo real
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return consolidatedItems;
    const term = searchTerm.toLowerCase();
    return consolidatedItems.filter(item => 
      item.descricao.toLowerCase().includes(term) ||
      item.unidadeMedida.toLowerCase().includes(term)
    );
  }, [consolidatedItems, searchTerm]);

  // Formatação monetária BRL
  const fmt = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '-';
    return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Quantidade formatada
  const fmtQtd = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '0';
    return Number(val).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  };

  // Soma do Melhor Valor Total
  const somaMelhorValorTotal = useMemo(() => {
    return consolidatedItems.reduce((acc, item) => acc + (item.melhorTotal || 0), 0);
  }, [consolidatedItems]);

  // Identificar quais itens um fornecedor perdeu em relação ao menor concorrente
  const obterItensPerdedores = (fornecedorNome: string): ItemPerdedor[] => {
    return consolidatedItems.filter(item => {
      const myQuote = item.quotes.find(q => q.fornecedorNome === fornecedorNome);
      if (!myQuote || myQuote.valorUnitario === null) return false;
      return item.melhorUnitario !== null && myQuote.valorUnitario > item.melhorUnitario;
    }).map(item => {
      const myQuote = item.quotes.find(q => q.fornecedorNome === fornecedorNome)!;
      const diffUnit = myQuote.valorUnitario! - item.melhorUnitario!;
      const diffTotal = diffUnit * item.quantidade;
      return {
        itemSeq: item.itemSeq,
        descricao: item.descricao,
        unidadeMedida: item.unidadeMedida,
        quantidade: item.quantidade,
        meuPrecoUnitario: myQuote.valorUnitario!,
        meuPrecoTotal: myQuote.valorTotal!,
        melhorPrecoUnitario: item.melhorUnitario!,
        melhorPrecoTotal: item.melhorTotal!,
        diffUnit,
        diffTotal
      };
    });
  };

  // Identificar quais itens um fornecedor venceu (menor preço do quadro)
  const obterItensVencedores = (fornecedorNome: string): ItemVencedor[] => {
    return consolidatedItems.filter(item => {
      const myQuote = item.quotes.find(q => q.fornecedorNome === fornecedorNome);
      if (!myQuote || myQuote.valorUnitario === null || myQuote.valorUnitario === undefined) return false;
      return item.melhorUnitario !== null && myQuote.valorUnitario === item.melhorUnitario;
    }).map(item => {
      const myQuote = item.quotes.find(q => q.fornecedorNome === fornecedorNome)!;
      return {
        itemSeq: item.itemSeq,
        descricao: item.descricao,
        unidadeMedida: item.unidadeMedida,
        quantidade: item.quantidade,
        precoUnitario: myQuote.valorUnitario!,
        precoTotal: myQuote.valorTotal!
      };
    });
  };

  // 1. Abrir Modal de Solicitação de Ajuste de Itens Perdedores
  const handleAbrirNegociacao = (orc: QuadroConcorrenciaDto, itens: ItemPerdedor[]) => {
    const obraNome = activeQc?.metadados?.nomeObra || `Obra #${obraId}`;
    const qcNum = activeQc?.metadados?.numeroQuadro || "QC";
    const totalDiferenca = itens.reduce((acc, curr) => acc + curr.diffTotal, 0);

    const listaItensTexto = itens.map(it => {
      return `• Item ${it.itemSeq} - ${it.descricao} (Qtd: ${fmtQtd(it.quantidade)} ${it.unidadeMedida || 'Pç'})
  - Seu Preço Unitário: ${fmt(it.meuPrecoUnitario)}
  - Valor Alvo Concorrente: ${fmt(it.melhorPrecoUnitario)} (Ajuste de -${fmt(it.diffUnit)}/un)`;
    }).join('\n\n');

    const saudacao = orc.nomeContato && orc.nomeContato.trim().length > 0
      ? `Prezado(a) ${orc.nomeContato.trim()},`
      : `Prezado(a) vendedor(a) da ${orc.nomeFornecedor},`;

    const assunto = `Solicitação de Ajuste de Preço - Concorrência ${qcNum} (${obraNome})`;

    const texto = `${saudacao}

Estamos finalizando o Quadro Comparativo de Preços (${qcNum}) da obra "${obraNome}" e temos grande interesse em fechar o fornecimento completo com a ${orc.nomeFornecedor}.

Para viabilizarmos o fechamento integral da cotação com vocês, identificamos que alguns itens ficaram acima dos concorrentes. Gostaríamos de solicitar o alinhamento dos preços para os valores-alvo abaixo:

ITENS A AJUSTAR:
${listaItensTexto}

RESUMO DA NEGOCIAÇÃO:
• Total de itens para ajuste: ${itens.length} item(ns)
• Diferença total a equiparar: ${fmt(totalDiferenca)}

Com a equiparação desses itens ao valor do concorrente, conseguimos formalizar o fechamento e emitir a Ordem de Compra para vocês.

Consegue verificar essa condição especial com a sua gerência comercial?

Fico no aguardo do seu breve retorno para fecharmos o pedido!

Atenciosamente,
Equipe de Suprimentos - Makinsthal`;

    setNegociacaoModal({
      orc,
      itens,
      assunto,
      emailTexto: texto
    });
    setCopiadoNegociacao(false);
  };

  // Auxiliar: Busca o próximo número sequencial de FD para a obra
  const obterProximoNumeroFd = async (targetObraId: number): Promise<string> => {
    try {
      const fds = await api.listarFaturamentosDiretos(targetObraId);
      let maxNum = 0;
      (Array.isArray(fds) ? fds : []).forEach(f => {
        if (f.numeroControle) {
          const dig = f.numeroControle.replace(/\D/g, '');
          if (dig) {
            const v = parseInt(dig, 10);
            if (v > maxNum) maxNum = v;
          }
        }
      });
      return String(maxNum + 1).padStart(3, '0');
    } catch {
      return '001';
    }
  };

  // Montador padronizado da mensagem com menção ao QC e ao Faturamento Direto
  const montarMensagemVencedores = (
    orc: QuadroConcorrenciaDto,
    vencedores: ItemVencedor[],
    perdedores: ItemPerdedor[],
    qcNum: string,
    obraNome: string,
    numeroQcVencedor: string,
    gerarQc: boolean,
    numeroFd: string,
    gerarFd: boolean
  ) => {
    const totalVencedor = vencedores.reduce((acc, curr) => acc + curr.precoTotal, 0);

    const listaVencedoresTexto = vencedores.map(it => {
      return `• Item ${it.itemSeq} - ${it.descricao} (Qtd: ${fmtQtd(it.quantidade)} ${it.unidadeMedida || 'Pç'}) - Unit: ${fmt(it.precoUnitario)} | Total: ${fmt(it.precoTotal)}`;
    }).join('\n');

    const listaPerdedoresTexto = perdedores.length > 0
      ? perdedores.map(it => `• Item ${it.itemSeq} - ${it.descricao}`).join('\n')
      : 'Nenhum item a excluir (fornecedor foi o mais vantajoso em 100% dos itens).';

    const saudacao = orc.nomeContato && orc.nomeContato.trim().length > 0
      ? `Prezado(a) ${orc.nomeContato.trim()},`
      : `Prezado(a) vendedor(a) da ${orc.nomeFornecedor},`;

    const numOrcTexto = orc.numeroOrcamento ? `nº ${orc.numeroOrcamento}` : '';
    const assunto = `Revisão de Orçamento ${numOrcTexto} - Fechamento de Itens Vencedores (${obraNome})`.trim();

    let blocoDocumentos = '';
    if (gerarQc && gerarFd) {
      blocoDocumentos = `DOCUMENTOS VINCULADOS AO PEDIDO:
Registramos no sistema o Quadro Comparativo exclusivo ${numeroQcVencedor} e o Faturamento Direto CONTROLE ${numeroFd} contendo exclusivamente os itens acima aprovados.
Seguem em anexo as planilhas do Quadro Comparativo (.xlsx) e do Faturamento Direto (.xlsx) para conferência.\n\n`;
    } else if (gerarQc) {
      blocoDocumentos = `QUADRO COMPARATIVO EXCLUSIVO VINCULADO:
Registramos no sistema o ${numeroQcVencedor} contendo exclusivamente os itens acima aprovados.
Segue em anexo a planilha de equalização comercial (.xlsx) para conferência.\n\n`;
    } else if (gerarFd) {
      blocoDocumentos = `FATURAMENTO DIRETO VINCULADO:
Registramos no sistema o Faturamento Direto CONTROLE ${numeroFd} contendo exclusivamente os itens acima aprovados.
Segue em anexo a planilha de Faturamento Direto (.xlsx) para conferência.\n\n`;
    }

    const texto = `${saudacao}

Após a conclusão da equalização das propostas comerciais para a obra "${obraNome}" (${qcNum}), temos a satisfação de informar que a ${orc.nomeFornecedor} foi a vencedora nos seguintes itens da cotação:

ITENS APROVADOS PARA FECHAMENTO:
${listaVencedoresTexto}

${perdedores.length > 0 ? `ITENS A EXCLUIR DO ORÇAMENTO:\n${listaPerdedoresTexto}\n\n` : ''}${blocoDocumentos}Solicitamos, por gentileza, a emissão e envio do espelho de orçamento ${numOrcTexto} atualizado contendo EXCLUSIVAMENTE os itens aprovados acima, no valor total de ${fmt(totalVencedor)}.

Com o recebimento do documento atualizado, prosseguiremos imediatamente com a formalização da Ordem de Compra.

Fico no aguardo do documento revisado para fecharmos!

Atenciosamente,
Equipe de Suprimentos - Makinsthal`;

    return { assunto, texto };
  };

  // 2. Abrir Modal de Solicitação de Exclusão de Itens Perdedores / Fechar Vencedores
  const handleAbrirPedidoVencedores = async (orc: QuadroConcorrenciaDto, vencedores: ItemVencedor[], perdedores: ItemPerdedor[]) => {
    const obraNome = activeQc?.metadados?.nomeObra || `Obra #${obraId}`;
    const qcNum = activeQc?.metadados?.numeroQuadro || "QC";

    // Nome sugerido do QC Vencedor (ex: QC-032-ELECON)
    const cleanSupplier = (orc.nomeFornecedor || 'FORNECEDOR')
      .trim()
      .replace(/[^a-zA-Z0-9À-ÿ\s]/g, '')
      .split(/\s+/)[0]
      .toUpperCase();
    const suggestedNumeroQc = `${qcNum}-${cleanSupplier}`;

    // Obtém o próximo número sequencial do FD da obra
    const proximoFd = await obterProximoNumeroFd(obraId);

    const { assunto, texto } = montarMensagemVencedores(
      orc,
      vencedores,
      perdedores,
      qcNum,
      obraNome,
      suggestedNumeroQc,
      true, // gerarQc
      proximoFd, // numeroFd
      true // gerarFd
    );

    setVencedoresModal({
      orc,
      itensVencedores: vencedores,
      itensPerdedores: perdedores,
      assunto,
      emailTexto: texto,
      gerarQc: true,
      numeroQcVencedor: suggestedNumeroQc,
      gerandoQc: false,
      qcGeradoSucesso: false,

      gerarFd: true,
      tipoNumeroFd: 'sequencial',
      proximoFdSequencial: proximoFd,
      numeroFdManual: '',
      gerandoFd: false,
      fdGeradoSucesso: false
    });
    setCopiadoVencedores(false);
  };

  const handleToggleGerarQc = (checked: boolean) => {
    if (!vencedoresModal) return;
    const obraNome = activeQc?.metadados?.nomeObra || `Obra #${obraId}`;
    const qcNum = activeQc?.metadados?.numeroQuadro || "QC";
    const fdNum = vencedoresModal.tipoNumeroFd === 'sequencial'
      ? vencedoresModal.proximoFdSequencial
      : (vencedoresModal.numeroFdManual.trim() || vencedoresModal.proximoFdSequencial);

    const { assunto, texto } = montarMensagemVencedores(
      vencedoresModal.orc,
      vencedoresModal.itensVencedores,
      vencedoresModal.itensPerdedores,
      qcNum,
      obraNome,
      vencedoresModal.numeroQcVencedor,
      checked,
      fdNum,
      vencedoresModal.gerarFd
    );

    setVencedoresModal({
      ...vencedoresModal,
      gerarQc: checked,
      assunto,
      emailTexto: texto
    });
  };

  const handleMudarNumeroQcVencedor = (num: string) => {
    if (!vencedoresModal) return;
    const obraNome = activeQc?.metadados?.nomeObra || `Obra #${obraId}`;
    const qcNum = activeQc?.metadados?.numeroQuadro || "QC";
    const fdNum = vencedoresModal.tipoNumeroFd === 'sequencial'
      ? vencedoresModal.proximoFdSequencial
      : (vencedoresModal.numeroFdManual.trim() || vencedoresModal.proximoFdSequencial);

    const { assunto, texto } = montarMensagemVencedores(
      vencedoresModal.orc,
      vencedoresModal.itensVencedores,
      vencedoresModal.itensPerdedores,
      qcNum,
      obraNome,
      num,
      vencedoresModal.gerarQc,
      fdNum,
      vencedoresModal.gerarFd
    );

    setVencedoresModal({
      ...vencedoresModal,
      numeroQcVencedor: num,
      assunto,
      emailTexto: texto
    });
  };

  const handleToggleGerarFd = (checked: boolean) => {
    if (!vencedoresModal) return;
    const obraNome = activeQc?.metadados?.nomeObra || `Obra #${obraId}`;
    const qcNum = activeQc?.metadados?.numeroQuadro || "QC";
    const fdNum = vencedoresModal.tipoNumeroFd === 'sequencial'
      ? vencedoresModal.proximoFdSequencial
      : (vencedoresModal.numeroFdManual.trim() || vencedoresModal.proximoFdSequencial);

    const { assunto, texto } = montarMensagemVencedores(
      vencedoresModal.orc,
      vencedoresModal.itensVencedores,
      vencedoresModal.itensPerdedores,
      qcNum,
      obraNome,
      vencedoresModal.numeroQcVencedor,
      vencedoresModal.gerarQc,
      fdNum,
      checked
    );

    setVencedoresModal({
      ...vencedoresModal,
      gerarFd: checked,
      assunto,
      emailTexto: texto
    });
  };

  const handleMudarTipoNumeroFd = (tipo: 'sequencial' | 'manual') => {
    if (!vencedoresModal) return;
    const obraNome = activeQc?.metadados?.nomeObra || `Obra #${obraId}`;
    const qcNum = activeQc?.metadados?.numeroQuadro || "QC";
    const fdNum = tipo === 'sequencial'
      ? vencedoresModal.proximoFdSequencial
      : (vencedoresModal.numeroFdManual.trim() || vencedoresModal.proximoFdSequencial);

    const { assunto, texto } = montarMensagemVencedores(
      vencedoresModal.orc,
      vencedoresModal.itensVencedores,
      vencedoresModal.itensPerdedores,
      qcNum,
      obraNome,
      vencedoresModal.numeroQcVencedor,
      vencedoresModal.gerarQc,
      fdNum,
      vencedoresModal.gerarFd
    );

    setVencedoresModal({
      ...vencedoresModal,
      tipoNumeroFd: tipo,
      assunto,
      emailTexto: texto
    });
  };

  const handleMudarNumeroFdManual = (val: string) => {
    if (!vencedoresModal) return;
    const obraNome = activeQc?.metadados?.nomeObra || `Obra #${obraId}`;
    const qcNum = activeQc?.metadados?.numeroQuadro || "QC";
    const fdNum = val.trim() || vencedoresModal.proximoFdSequencial;

    const { assunto, texto } = montarMensagemVencedores(
      vencedoresModal.orc,
      vencedoresModal.itensVencedores,
      vencedoresModal.itensPerdedores,
      qcNum,
      obraNome,
      vencedoresModal.numeroQcVencedor,
      vencedoresModal.gerarQc,
      fdNum,
      vencedoresModal.gerarFd
    );

    setVencedoresModal({
      ...vencedoresModal,
      numeroFdManual: val.toUpperCase(),
      assunto,
      emailTexto: texto
    });
  };

  // Salvar QC Vencedor e Faturamento Direto no Banco
  const handleConfirmarGerarTudoVencedor = async (): Promise<{ qcCriadoId?: number; fdCriadoId?: number }> => {
    if (!vencedoresModal || !activeQc) return {};
    const qcOriginalId = activeQc.metadados?.id || selectedQcId;
    if (!qcOriginalId) {
      alert("Identificador do QC original não encontrado.");
      return {};
    }

    setVencedoresModal(prev => prev ? { ...prev, gerandoQc: true, gerandoFd: true } : null);
    try {
      // 1. Gera QC Vencedor se solicitado
      let qcCriadoId = vencedoresModal.novoQcCriadoId;
      if (vencedoresModal.gerarQc && !qcCriadoId) {
        const itensParaEnviar = vencedoresModal.itensVencedores.map(it => ({
          marca: it.marca || '',
          descricao: it.descricao,
          unidadeMedida: it.unidadeMedida || 'UN',
          quantidade: it.quantidade,
          valorUnitario: it.precoUnitario,
          valorTotal: it.precoTotal,
          aliquotaIpi: 0
        }));

        const novoQc = await api.gerarQcVencedor({
          qcOriginalId,
          numeroQuadroVencedor: vencedoresModal.numeroQcVencedor.trim(),
          fornecedorNome: vencedoresModal.orc.nomeFornecedor,
          itensVencedores: itensParaEnviar
        });
        qcCriadoId = novoQc.id;
      }

      // 2. Gera Faturamento Direto se solicitado
      let fdCriadoId = vencedoresModal.novoFdCriadoId;
      const fdNumero = vencedoresModal.tipoNumeroFd === 'sequencial'
        ? vencedoresModal.proximoFdSequencial
        : (vencedoresModal.numeroFdManual.trim() || vencedoresModal.proximoFdSequencial);

      if (vencedoresModal.gerarFd && !fdCriadoId) {
        // Usa o novo QC exclusivo para que o FD herde EXCLUSIVAMENTE os itens vencedores
        const idQcParaFd = qcCriadoId || qcOriginalId;
        const novoFd = await api.gerarFaturamentoDiretoDeQc({
          qcId: idQcParaFd,
          fornecedorNome: vencedoresModal.orc.nomeFornecedor,
          numeroControle: fdNumero
        });
        fdCriadoId = novoFd.id;
      }

      await carregarQcsDaObra();

      setVencedoresModal(prev => prev ? {
        ...prev,
        gerandoQc: false,
        gerandoFd: false,
        qcGeradoSucesso: Boolean(qcCriadoId),
        fdGeradoSucesso: Boolean(fdCriadoId),
        novoQcCriadoId: qcCriadoId,
        novoFdCriadoId: fdCriadoId
      } : null);

      const numQcClean = vencedoresModal.numeroQcVencedor.trim();
      const msgQc = qcCriadoId ? (numQcClean.toUpperCase().startsWith('QC') ? numQcClean : `QC ${numQcClean}`) : '';
      const msgFd = fdCriadoId ? `Faturamento Direto CONTROLE ${fdNumero}` : '';
      const juncao = msgQc && msgFd ? `${msgQc} e ${msgFd}` : (msgQc || msgFd);
      setSucessoQc(`${juncao} salvo(s) com sucesso!`);

      return { qcCriadoId, fdCriadoId };
    } catch (err: any) {
      console.error("Erro ao gerar vencedores:", err);
      alert("Erro ao salvar fechamento de vencedores: " + (err.response?.data?.message || err.message));
      setVencedoresModal(prev => prev ? { ...prev, gerandoQc: false, gerandoFd: false } : null);
      return {};
    }
  };

  const ensureTudoGerado = async () => {
    if (!vencedoresModal) return;
    if ((vencedoresModal.gerarQc && !vencedoresModal.novoQcCriadoId) || (vencedoresModal.gerarFd && !vencedoresModal.novoFdCriadoId)) {
      await handleConfirmarGerarTudoVencedor();
    }
  };
  const ensureQcGerado = ensureTudoGerado;
  const handleConfirmarGerarQcVencedor = handleConfirmarGerarTudoVencedor;

  const handleBaixarExcelVencedoresModal = async () => {
    if (!vencedoresModal || !activeQc) return;
    const nomeXlsx = `${vencedoresModal.numeroQcVencedor}_Itens_Vencedores.xlsx`;
    try {
      if (vencedoresModal.novoQcCriadoId) {
        const comp = await api.buscarQcComparativo(vencedoresModal.novoQcCriadoId);
        await api.exportarExcelDireto(comp, nomeXlsx);
        return;
      }

      const compVencedor: QuadroComparativoDto = {
        metadados: {
          id: 0,
          numeroQuadro: vencedoresModal.numeroQcVencedor,
          nomeObra: activeQc.metadados?.nomeObra || '',
          dataCriacao: new Date().toISOString()
        },
        fornecedorVencedor: vencedoresModal.orc.nomeFornecedor,
        somaMelhorValorTotal: vencedoresModal.itensVencedores.reduce((acc, curr) => acc + curr.precoTotal, 0),
        materiais: vencedoresModal.itensVencedores.map(it => ({
          seq: it.itemSeq,
          descricao: it.descricao,
          quantidade: it.quantidade,
          unidadeMedida: it.unidadeMedida || 'UN',
          melhorValorUnitario: it.precoUnitario,
          melhorValorTotal: it.precoTotal,
          fornecedorMaisBarato: vencedoresModal.orc.nomeFornecedor,
          aliquotaIpi: 0
        })),
        orcamentos: [{
          ...vencedoresModal.orc,
          valorTotalGeral: vencedoresModal.itensVencedores.reduce((acc, curr) => acc + curr.precoTotal, 0),
          itens: vencedoresModal.itensVencedores.map(it => ({
            descricao: it.descricao,
            quantidade: it.quantidade,
            unidadeMedida: it.unidadeMedida || 'UN',
            valorUnitario: it.precoUnitario,
            valorTotal: it.precoTotal,
            marca: it.marca || '',
            aliquotaIpi: 0
          }))
        }]
      };
      await api.exportarExcelDireto(compVencedor, nomeXlsx);
    } catch (err) {
      console.error("Erro ao baixar Excel de vencedores:", err);
      alert("Erro ao baixar planilha de vencedores.");
    }
  };

  const handleBaixarExcelFdModal = async () => {
    if (!vencedoresModal || !activeQc) return;
    try {
      let fdId = vencedoresModal.novoFdCriadoId;
      const fdNumero = vencedoresModal.tipoNumeroFd === 'sequencial'
        ? vencedoresModal.proximoFdSequencial
        : (vencedoresModal.numeroFdManual.trim() || vencedoresModal.proximoFdSequencial);

      if (!fdId) {
        const { fdCriadoId } = await handleConfirmarGerarTudoVencedor();
        fdId = fdCriadoId;
      }

      if (fdId) {
        await api.downloadExcelFaturamentoDireto(fdId, fdNumero);
      } else {
        alert("Salve o Faturamento Direto para realizar o download.");
      }
    } catch (err: any) {
      console.error("Erro ao baixar Excel do FD:", err);
      alert("Erro ao baixar planilha do Faturamento Direto: " + (err.response?.data?.message || err.message));
    }
  };

  const handleBaixarExcelQcVencedor = async (qcId: number) => {
    try {
      const comp = await api.buscarQcComparativo(qcId);
      const nomeXlsx = `${comp.metadados?.numeroQuadro || 'QC'}_Itens_Vencedores.xlsx`;
      await api.exportarExcelDireto(comp, nomeXlsx);
    } catch (err) {
      console.error("Erro ao baixar Excel do QC vencedor:", err);
      alert("Erro ao baixar planilha Excel deste QC.");
    }
  };

  const handleCopiarTextoNegociacao = () => {
    if (!negociacaoModal) return;
    navigator.clipboard.writeText(negociacaoModal.emailTexto);
    setCopiadoNegociacao(true);
    setTimeout(() => setCopiadoNegociacao(false), 3000);
  };

  const handleCopiarTextoVencedores = async () => {
    if (!vencedoresModal) return;
    await ensureQcGerado();
    navigator.clipboard.writeText(vencedoresModal.emailTexto);
    setCopiadoVencedores(true);
    setTimeout(() => setCopiadoVencedores(false), 3000);
  };

  return (
    <div className="p-6 space-y-6 text-slate-100 font-sans w-full">
      
      {/* Alerta de Sucesso */}
      {sucessoQc && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl flex items-center justify-between shadow-lg shadow-emerald-500/5 animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{sucessoQc}</span>
          </div>
          <button onClick={() => setSucessoQc(null)} className="text-emerald-400 hover:text-emerald-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. SELETOR DE QC SALVO + ZONA DE UPLOAD */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 w-full">
        
        {/* Topo: Consultar QC do Banco vs Novo Upload */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Consultar e Montar Quadro Comparativo (Obra #{obraId})
              </h2>
              <p className="text-xs text-slate-400">
                Selecione um QC já salvo no banco para carregar montado na tela ou envie novos orçamentos
              </p>
            </div>
          </div>

          {/* DROPDOWN DINÂMICO DE QCS SALVOS */}
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <span className="text-xs font-semibold text-slate-300 shrink-0">QC da Obra:</span>
            <select
              value={selectedQcId || ''}
              onChange={(e) => handleCarregarQc(Number(e.target.value))}
              disabled={carregandoQc || modoEdicao}
              className="bg-slate-950 border border-slate-700 hover:border-blue-500 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer w-full md:w-auto min-w-[200px] disabled:opacity-50"
            >
              <option value="">-- Selecionar QC Principal --</option>
              {isQcDerivado && activeQc && !qcsPrincipais.some(q => q.id === selectedQcId) && (
                <option value={selectedQcId || ''}>
                  ⭐ {activeQc.metadados?.numeroQuadro} (QC Derivado Atual)
                </option>
              )}
              {qcsPrincipais.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.numeroQuadro} ({q.dataCriacao || 'Salvo'})
                </option>
              ))}
            </select>

            <button
              onClick={carregarQcsDaObra}
              disabled={modoEdicao}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition cursor-pointer disabled:opacity-50"
              title="Atualizar lista de QCs"
            >
              <RefreshCw className={`w-4 h-4 ${carregandoQc ? 'animate-spin' : ''}`} />
            </button>

            {selectedQcId && (
              <button
                onClick={() => handleAbrirModalExcluirQc(selectedQcId, activeQc?.metadados?.numeroQuadro)}
                disabled={modoEdicao}
                className="p-2 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 rounded-xl transition cursor-pointer disabled:opacity-50"
                title={`Excluir este QC (${activeQc?.metadados?.numeroQuadro || 'QC'})`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Zona de Arquivos para Upload */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <label className="cursor-pointer px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-sm">
              <Paperclip className="w-4 h-4 text-slate-400" />
              <span>Escolher novos PDFs</span>
              <input 
                type="file" 
                multiple 
                accept=".pdf" 
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {files.length > 0 ? (
              <span className="px-3 py-1.5 bg-blue-950/60 text-blue-400 border border-blue-800/40 rounded-full text-xs font-medium flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                {files.length} arquivo(s) selecionado(s) para nova rodada de concorrência.
              </span>
            ) : (
              <span className="text-xs text-slate-500 italic">
                Nenhum novo arquivo selecionado
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            {activeQc && (
              <button
                onClick={handleLimparQC}
                disabled={modoEdicao}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50"
              >
                Limpar Tela
              </button>
            )}

            <button 
              onClick={() => handleIniciarGeracao('visualizar')}
              disabled={loading || files.length === 0 || modoEdicao}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
              title="Processar PDFs e exibir o comparativo na tela"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading && acaoPendente === 'visualizar' ? "Processando com IA..." : "Gerar Comparativo"}</span>
            </button>

            <button 
              onClick={handleExportExcel}
              disabled={loading || (!activeQc && files.length === 0) || modoEdicao}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20 cursor-pointer"
              title="Baixar Quadro Comparativo em formato Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{loading && acaoPendente === 'excel' ? "Gerando Excel..." : "Baixar Excel"}</span>
            </button>
          </div>
        </div>

        {loading && (
          <div className="p-6 bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900 border border-blue-500/40 rounded-2xl flex items-center justify-center gap-4 shadow-xl animate-pulse">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/30 shrink-0">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Processando Cotações com Inteligência Artificial...</span>
                <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">
                  {files.length} {files.length === 1 ? 'proposta' : 'propostas em paralelo'}
                </span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Extraindo dados das propostas comerciais, equalizando materiais e calculando os melhores preços. Aguarde alguns segundos...
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-950/40 border border-red-800 text-red-400 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* 2. QUADRO COMPARATIVO MONTADO NA TELA */}
      {activeQc ? (
        <div className="space-y-4 w-full">

          {/* Banner informativo caso esteja visualizando um QC exclusivo derivado de vencedores */}
          {isQcDerivado && qcPai && (
            <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900 border border-blue-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100 text-sm">
                      Quadro Exclusivo de Itens Vencedores
                    </span>
                    <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {currentBaseNumero}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Este quadro foi gerado a partir do comparativo geral <strong className="text-blue-300 font-mono">{numeroQcPai}</strong>.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCarregarQc(qcPai.id)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-blue-600/20 cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar ao {numeroQcPai} (Todos os Fornecedores)</span>
              </button>
            </div>
          )}
          
          {/* Header do QC Processado + Busca + Legenda + Botão ATUALIZAR QC */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 shrink-0">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-100">Quadro Comparativo:</span>
                    {modoEdicao ? (
                      <input
                        type="text"
                        value={activeQc.metadados?.numeroQuadro || ''}
                        onChange={(e) => handleAlterarMetadado('numeroQuadro', e.target.value.toUpperCase())}
                        placeholder="QC-001"
                        className="px-2 py-0.5 bg-slate-950 border border-emerald-500 rounded font-mono font-black text-emerald-400 text-sm w-28 uppercase focus:outline-none"
                      />
                    ) : (
                      <span className="text-emerald-400 font-mono font-black text-base">
                        {activeQc.metadados?.numeroQuadro || "QC-001"}
                      </span>
                    )}
                  </div>
                  
                  {/* Linha com Obra, Data de Elaboração e BOTÃO ATUALIZAR QC */}
                  <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap mt-1">
                    <span>
                      Obra: <strong className="text-slate-200">{activeQc.metadados?.nomeObra || `Obra #${obraId}`}</strong> • Elaborado em
                    </span>

                    {modoEdicao ? (
                      <input
                        type="date"
                        value={typeof activeQc.metadados?.dataElaboracao === 'string' ? activeQc.metadados.dataElaboracao.slice(0, 10) : ''}
                        onChange={(e) => handleAlterarMetadado('dataElaboracao', e.target.value)}
                        className="px-2 py-0.5 bg-slate-950 border border-slate-700 focus:border-blue-500 rounded text-xs text-slate-200 font-mono"
                      />
                    ) : (
                      <span>{activeQc.metadados?.dataElaboracao || 'Data N/D'}</span>
                    )}

                    {/* BOTÕES DE AÇÃO: ATUALIZAR E EXCLUIR QC */}
                    {!modoEdicao ? (
                      <div className="inline-flex items-center gap-2 ml-2">
                        <button
                          onClick={handleIniciarEdicaoQc}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-600/90 hover:bg-blue-600 text-white text-xs font-semibold transition cursor-pointer shadow-md shadow-blue-600/20 active:scale-95"
                          title="Tornar todos os campos e preços do orçamento editáveis na tela"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Atualizar QC</span>
                        </button>

                        <button
                          onClick={() => handleAbrirModalExcluirQc(activeQc.metadados?.id || selectedQcId, activeQc.metadados?.numeroQuadro)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-semibold transition cursor-pointer shadow-sm active:scale-95"
                          title="Excluir este Quadro Comparativo do banco de dados"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Excluir QC</span>
                        </button>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 ml-2">
                        <button
                          onClick={handleSalvarEdicaoQc}
                          disabled={salvandoEdicao}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/25 disabled:opacity-50 cursor-pointer"
                        >
                          {salvandoEdicao ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Salvando...</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-3.5 h-3.5" />
                              <span>Salvar Alterações</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={handleCancelarEdicaoQc}
                          disabled={salvandoEdicao}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition border border-slate-700 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Cancelar</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs px-3.5 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-bold flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Vencedor Geral: <strong>{activeQc.fornecedorVencedor || "Em análise"}</strong></span>
                </span>
              </div>
            </div>

            {/* Aviso Flutuante de Modo de Edição Ativo */}
            {modoEdicao && (
              <div className="bg-amber-500/10 border border-amber-500/40 text-amber-300 p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-fade-in shadow-inner">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0"></span>
                  <div>
                    <strong className="font-bold text-amber-200">Modo de Edição Ativo: </strong>
                    <span>Você pode alterar os preços unitários, quantidades, unidades, marcas e dados dos fornecedores diretamente na tabela. Os totais e vencedores são recalculados instantaneamente.</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <button
                    onClick={handleSalvarEdicaoQc}
                    disabled={salvandoEdicao}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-sm transition"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Concluir e Salvar</span>
                  </button>
                  <button
                    onClick={handleCancelarEdicaoQc}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"
                  >
                    Descartar
                  </button>
                </div>
              </div>
            )}

            {/* Barra de Busca de Itens e Estatísticas */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filtrar item ou unidade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span>{filteredItems.length} itens listados</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
                  <span className="text-slate-300">Menor preço do item</span>
                </span>
              </div>
            </div>
          </div>

          {/* 3. TABELA COMPARATIVA COMPLETA COM COTAÇÃO CRUZADA & CAMPOS EDITÁVEIS */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden w-full">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs border-collapse">
                
                {/* Linha 1 de Cabeçalho: Dados das Colunas Base + Agrupamento de Fornecedores */}
                <thead>
                  <tr className="bg-slate-950/90 text-slate-300 border-b border-slate-800 text-[11px] font-bold">
                    <th rowSpan={2} className="p-3 border-r border-slate-800 text-center w-12 text-slate-400">Seq</th>
                    <th rowSpan={2} className="p-3 border-r border-slate-800 min-w-[260px]">Descrição dos Materiais</th>
                    <th rowSpan={2} className="p-3 border-r border-slate-800 text-center w-20">Und</th>
                    <th rowSpan={2} className="p-3 border-r border-slate-800 text-right w-24">Qtd</th>

                    {/* Colunas Agrupadas para Cada Fornecedor Cotado */}
                    {activeQc.orcamentos?.map((orc, idx) => {
                      const perdedores = obterItensPerdedores(orc.nomeFornecedor);
                      const vencedores = obterItensVencedores(orc.nomeFornecedor);

                      return (
                        <th 
                          key={idx} 
                          colSpan={3} 
                          className="p-3 border-r border-slate-800 text-center bg-slate-900/60"
                        >
                          <div className="flex flex-col items-center gap-1.5 py-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-slate-100 text-xs tracking-tight">
                                {orc.nomeFornecedor}
                              </span>
                              {activeQc.fornecedorVencedor === orc.nomeFornecedor && (
                                <Trophy className="w-3.5 h-3.5 text-amber-400 inline" />
                              )}
                            </div>
                            
                            {/* Número do Orçamento e Nome do Vendedor/Contato (Editáveis se modoEdicao for true) */}
                            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 flex-wrap">
                              {modoEdicao ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={orc.numeroOrcamento || ''}
                                    onChange={(e) => handleAlterarNumeroOrcamento(orc.nomeFornecedor, e.target.value)}
                                    placeholder="№ Orçamento"
                                    className="px-1.5 py-0.5 bg-slate-950 border border-slate-700 focus:border-blue-500 rounded text-[10px] font-mono text-slate-200 text-center w-24"
                                    title="Modificar número do orçamento"
                                  />
                                  <input
                                    type="text"
                                    value={orc.nomeContato || ''}
                                    onChange={(e) => handleAlterarContatoFornecedor(orc.nomeFornecedor, e.target.value)}
                                    placeholder="Vendedor"
                                    className="px-1.5 py-0.5 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded text-[10px] text-emerald-400 text-center w-24"
                                    title="Modificar nome do contato"
                                  />
                                </div>
                              ) : (
                                <>
                                  {orc.numeroOrcamento && (
                                    <span className="font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                                      № {orc.numeroOrcamento}
                                    </span>
                                  )}
                                  {orc.nomeContato && (
                                    <span className="text-emerald-400/90 font-medium">
                                      Contato: {orc.nomeContato}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>

                            {/* Botões de Ação Estratégica: Negociar Perdedores & Fechar Vencedores */}
                            {!modoEdicao && (
                              <div className="flex flex-col sm:flex-row items-center gap-1.5 mt-1.5">
                                {perdedores.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleAbrirNegociacao(orc, perdedores)}
                                    className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:border-amber-400 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shadow-sm"
                                    title="Solicitar que este fornecedor cubra o menor preço dos concorrentes"
                                  >
                                    <TrendingDown className="w-3 h-3 text-amber-400" />
                                    <span>Ajustar Perdedores ({perdedores.length})</span>
                                  </button>
                                )}

                                {vencedores.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleAbrirPedidoVencedores(orc, vencedores, perdedores)}
                                    className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:border-emerald-400 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shadow-sm"
                                    title="Solicitar espelho de orçamento contendo somente os itens ganhos deste fornecedor"
                                  >
                                    <FileCheck className="w-3 h-3 text-emerald-400" />
                                    <span>Fechar Vencedores ({vencedores.length})</span>
                                  </button>
                                )}
                              </div>
                            )}

                          </div>
                        </th>
                      );
                    })}

                    {/* Coluna Consolidada da Melhor Cotação Encontrada */}
                    <th colSpan={2} className="p-3 text-center bg-emerald-950/20 text-emerald-400">
                      Melhor Cotação Encontrada
                    </th>
                  </tr>

                  {/* Linha 2 de Cabeçalho: Subcolunas de cada Fornecedor */}
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase font-semibold">
                    {activeQc.orcamentos?.map((_, idx) => (
                      <React.Fragment key={idx}>
                        <th className="p-2 border-r border-slate-800 text-center w-20">Marca</th>
                        <th className="p-2 border-r border-slate-800 text-right w-28">Unit (R$)</th>
                        <th className="p-2 border-r border-slate-800 text-right w-28">Total (R$)</th>
                      </React.Fragment>
                    ))}
                    <th className="p-2 border-r border-slate-800 text-right w-24 bg-emerald-950/10 text-emerald-400">Melhor Unit</th>
                    <th className="p-2 text-right w-24 bg-emerald-950/10 text-emerald-400">Melhor Total</th>
                  </tr>
                </thead>

                {/* Corpo da Tabela: Itens Consolidados (Com Inputs no Modo Edição) */}
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  {filteredItems.map((item) => (
                    <tr 
                      key={item.itemSeq} 
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="p-2.5 text-center text-slate-500 border-r border-slate-800">{item.itemSeq}</td>
                      
                      {/* Descrição dos Materiais */}
                      <td className="p-2 border-r border-slate-800 font-sans font-medium text-slate-200">
                        {modoEdicao ? (
                          <input
                            type="text"
                            value={item.descricao}
                            onChange={(e) => handleAlterarDescricao(item.descricao, e.target.value)}
                            className="w-full px-2 py-1 bg-slate-950 border border-slate-700 focus:border-blue-500 rounded text-xs text-slate-100 font-sans"
                          />
                        ) : (
                          item.descricao
                        )}
                      </td>

                      {/* Unidade de Medida */}
                      <td className="p-2 text-center text-slate-400 border-r border-slate-800">
                        {modoEdicao ? (
                          <input
                            type="text"
                            value={item.unidadeMedida}
                            onChange={(e) => handleAlterarUnidade(item.descricao, e.target.value.toUpperCase())}
                            className="w-14 px-1 py-1 bg-slate-950 border border-slate-700 focus:border-blue-500 rounded text-center text-xs text-slate-200 uppercase font-mono"
                          />
                        ) : (
                          item.unidadeMedida
                        )}
                      </td>

                      {/* Quantidade */}
                      <td className="p-2 text-right text-slate-300 font-semibold border-r border-slate-800">
                        {modoEdicao ? (
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={item.quantidade}
                            onChange={(e) => handleAlterarQuantidade(item.descricao, parseFloat(e.target.value) || 0)}
                            className="w-20 px-1.5 py-1 bg-slate-950 border border-slate-700 focus:border-blue-500 rounded text-right text-xs font-mono text-slate-100 font-bold"
                          />
                        ) : (
                          fmtQtd(item.quantidade)
                        )}
                      </td>

                      {/* Valores Cotados por Cada Fornecedor */}
                      {item.quotes.map((q, qIdx) => (
                        <React.Fragment key={qIdx}>
                          {/* Marca */}
                          <td className="p-2 text-center text-slate-400 border-r border-slate-800 text-[11px]">
                            {modoEdicao ? (
                              <input
                                type="text"
                                value={q.marca || ''}
                                onChange={(e) => handleAlterarMarca(item.descricao, q.fornecedorNome, e.target.value)}
                                placeholder="-"
                                className="w-16 px-1 py-1 bg-slate-950 border border-slate-700 focus:border-blue-500 rounded text-center text-[11px] text-slate-300 font-sans"
                              />
                            ) : (
                              q.marca || '-'
                            )}
                          </td>

                          {/* Unitário (R$) */}
                          <td className={`p-2 text-right border-r border-slate-800 ${q.isMelhorUnitario ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-slate-300'}`}>
                            {modoEdicao ? (
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={q.valorUnitario !== null && q.valorUnitario !== undefined ? q.valorUnitario : ''}
                                onChange={(e) => handleAlterarPrecoUnitario(item.descricao, q.fornecedorNome, e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                placeholder="0.00"
                                className="w-24 px-1.5 py-1 bg-slate-950 border border-blue-500/60 focus:border-emerald-400 rounded text-right text-xs font-mono font-bold text-emerald-400 shadow-inner"
                              />
                            ) : (
                              fmt(q.valorUnitario)
                            )}
                          </td>

                          {/* Total (R$) - Recalculado dinamicamente */}
                          <td className={`p-2.5 text-right border-r border-slate-800 ${q.isMelhorTotal ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-slate-300'}`}>
                            {fmt(q.valorTotal)}
                          </td>
                        </React.Fragment>
                      ))}

                      {/* Menor Preço Unitário e Total Consolidado */}
                      <td className="p-2.5 text-right text-emerald-400 font-bold border-r border-slate-800 bg-emerald-950/10">
                        {fmt(item.melhorUnitario)}
                      </td>
                      <td className="p-2.5 text-right text-emerald-400 font-bold bg-emerald-950/10">
                        {fmt(item.melhorTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>

                {/* Rodapé da Tabela: Totais dos Fornecedores e Vencedor */}
                <tfoot className="border-t-2 border-slate-700 bg-slate-950/90 font-bold text-xs">
                  
                  {/* Linha Total Mercadorias */}
                  <tr className="border-b border-slate-800/80">
                    <td colSpan={4} className="p-2.5 text-right text-slate-400 uppercase tracking-wider text-[11px] border-r border-slate-800">
                      Total Mercadorias (R$)
                    </td>
                    {activeQc.orcamentos?.map((orc, idx) => (
                      <React.Fragment key={idx}>
                        <td colSpan={2} className="p-2.5 border-r border-slate-800"></td>
                        <td className="p-2.5 text-right text-slate-200 border-r border-slate-800 font-mono">
                          {fmt(orc.valorTotalMercadoria || orc.valorTotalGeral)}
                        </td>
                      </React.Fragment>
                    ))}
                    <td colSpan={2} className="p-2.5 bg-emerald-950/10"></td>
                  </tr>

                  {/* Linha Total IPI */}
                  <tr className="border-b border-slate-800/80">
                    <td colSpan={4} className="p-2.5 text-right text-slate-400 uppercase tracking-wider text-[11px] border-r border-slate-800">
                      Total IPI (R$)
                    </td>
                    {activeQc.orcamentos?.map((orc, idx) => (
                      <React.Fragment key={idx}>
                        <td colSpan={2} className="p-2.5 border-r border-slate-800"></td>
                        <td className="p-2.5 text-right text-slate-400 border-r border-slate-800 font-mono">
                          {fmt(orc.valorTotalIpi || 0)}
                        </td>
                      </React.Fragment>
                    ))}
                    <td colSpan={2} className="p-2.5 bg-emerald-950/10"></td>
                  </tr>

                  {/* Linha VALOR TOTAL GERAL */}
                  <tr className="bg-slate-900 text-sm">
                    <td colSpan={4} className="p-3.5 text-right text-slate-100 font-black tracking-wider uppercase border-r border-slate-800">
                      VALOR TOTAL GERAL
                    </td>
                    {activeQc.orcamentos?.map((orc, idx) => {
                      const isVencedor = activeQc.fornecedorVencedor === orc.nomeFornecedor;
                      return (
                        <React.Fragment key={idx}>
                          <td colSpan={2} className="p-3.5 border-r border-slate-800"></td>
                          <td className={`p-3.5 text-right border-r border-slate-800 font-mono font-black ${isVencedor ? 'bg-amber-500/10 text-amber-400 text-base' : 'text-slate-100'}`}>
                            {fmt(orc.valorTotalGeral)}
                            {isVencedor && (
                              <span className="block text-[10px] text-amber-400 font-sans font-semibold tracking-normal mt-0.5">
                                🏆 VENCEDOR
                              </span>
                            )}
                          </td>
                        </React.Fragment>
                      );
                    })}
                    
                    {/* Cenário Otimizado (Split/Menores Preços Somados) */}
                    <td colSpan={2} className="p-3.5 text-right bg-emerald-950/30 text-emerald-400 font-mono font-black text-sm">
                      {fmt(somaMelhorValorTotal)}
                      <span className="block text-[10px] text-emerald-400 font-sans font-semibold tracking-normal mt-0.5">
                        MELHOR CENÁRIO (SPLIT)
                      </span>
                    </td>
                  </tr>

                </tfoot>
              </table>
            </div>
          </div>

          {/* SEÇÃO DE QCS DE FORNECEDORES VENCEDORES DERIVADOS DESTE QC */}
          {activeQc && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-100">
                        QCs de Fornecedores Vencedores
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {qcsVencedoresVinculados.length} {qcsVencedoresVinculados.length === 1 ? 'Quadro Derivado' : 'Quadros Derivados'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Quadros comparativos gerados exclusivamente com os itens ganhos de cada fornecedor neste QC ({activeQc.metadados?.numeroQuadro || 'comparativo'}).
                    </p>
                  </div>
                </div>
              </div>

              {qcsVencedoresVinculados.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {qcsVencedoresVinculados.map((qcVenc) => {
                    const nomeFornecedorVenc = qcVenc.numeroQuadro.replace(new RegExp(`^${activeQc.metadados?.numeroQuadro}-`, 'i'), '');
                    return (
                      <div
                        key={qcVenc.id}
                        className="bg-slate-950/70 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 flex flex-col justify-between gap-4 transition shadow-md hover:shadow-amber-500/5 group"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-3 py-1 bg-amber-500/15 text-amber-300 font-mono font-bold text-xs rounded-lg border border-amber-500/30 flex items-center gap-1.5">
                              <FileCheck className="w-3.5 h-3.5 text-amber-400" />
                              {qcVenc.numeroQuadro}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {qcVenc.dataCriacao ? new Date(qcVenc.dataCriacao).toLocaleDateString('pt-BR') : 'Data recente'}
                            </span>
                          </div>

                          <div>
                            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold block">Fornecedor Vencedor</span>
                            <h4 className="text-base font-bold text-slate-100 group-hover:text-amber-400 transition">
                              {nomeFornecedorVenc || 'Fornecedor Vencedor'}
                            </h4>
                          </div>

                          <p className="text-xs text-slate-400 leading-relaxed">
                            Quadro fechado contendo unicamente os itens em que este fornecedor obteve o menor valor neste comparativo.
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleCarregarQc(qcVenc.id)}
                            className="flex-1 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-slate-800 cursor-pointer"
                            title="Abrir e conferir este QC exclusivo"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-400" />
                            <span>Visualizar QC</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleBaixarExcelQcVencedor(qcVenc.id)}
                            className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                            title="Baixar planilha Excel (.xlsx) dos itens vencedores"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Baixar Excel</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAbrirModalExcluirQc(qcVenc.id, qcVenc.numeroQuadro)}
                            className="p-2 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 rounded-xl transition cursor-pointer"
                            title={`Excluir este QC vencedor (${qcVenc.numeroQuadro})`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-slate-950/40 border border-dashed border-slate-800/80 rounded-2xl p-5 text-center space-y-2">
                  <p className="text-xs text-slate-400">
                    Nenhum QC exclusivo de fornecedor vencedor gerado para o <strong className="text-slate-200">{activeQc.metadados?.numeroQuadro}</strong> ainda.
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-lg mx-auto">
                    Ao clicar no botão <strong className="text-emerald-400">"Fechar Vencedores"</strong> no topo da coluna de qualquer fornecedor na tabela acima, você pode gerar o quadro individual (ex: <span className="font-mono text-amber-400">{activeQc.metadados?.numeroQuadro}-[FORNECEDOR]</span>) contendo somente os itens ganhos.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Observações e Rodapé */}
          <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-2">
            <span>Quadro Comparativo montado do banco de dados</span>
            <span className="flex items-center gap-1.5 text-emerald-500">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Orçamentos auditados e salvos no banco de dados
            </span>
          </div>

        </div>
      ) : (
        /* Estado Vazio: Nenhum QC Selecionado e Nenhum Arquivo Enviado */
        <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <div className="p-4 bg-slate-900 text-slate-500 rounded-2xl w-16 h-16 mx-auto flex items-center justify-center border border-slate-800">
            <Scale className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-300">
              Nenhum Quadro Comparativo Carregado
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Selecione um QC já existente no seletor acima para abrir sua concorrência ou faça o upload de novos PDFs para processar com a IA.
            </p>
          </div>
        </div>
      )}

      {/* 4. MODAL PARA DEFINIR NÚMERO DO QC AO GERAR */}
      {modalDefinirQcAberto && createPortal(
        <div className="fixed inset-0 top-0 left-0 w-screen h-screen z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-scaleUp">
            
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600/10 text-blue-400 rounded-2xl border border-blue-500/20">
                  <Hash className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    Definir Identificação do QC
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Escolha a numeração para os {files.length} orçamento(s) selecionado(s)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalDefinirQcAberto(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Opção 1: Usar Número da Sequência */}
              <div 
                onClick={() => setTipoNumeroQc('sequencial')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                  tipoNumeroQc === 'sequencial'
                    ? 'bg-blue-600/10 border-blue-500/50 shadow-md shadow-blue-500/5'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <input 
                  type="radio" 
                  name="opcaoQc" 
                  checked={tipoNumeroQc === 'sequencial'} 
                  onChange={() => setTipoNumeroQc('sequencial')}
                  className="mt-1 text-blue-500 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">
                      Usar número da sequência automática
                    </span>
                    <span className="font-mono font-black text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {proximoSequencialCalculado}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    O sistema utilizará a próxima ordem consecutiva disponível para esta obra.
                  </p>
                </div>
              </div>

              {/* Opção 2: Modificar / Personalizar Número do QC */}
              <div 
                onClick={() => setTipoNumeroQc('manual')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                  tipoNumeroQc === 'manual'
                    ? 'bg-blue-600/10 border-blue-500/50 shadow-md shadow-blue-500/5'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <input 
                  type="radio" 
                  name="opcaoQc" 
                  checked={tipoNumeroQc === 'manual'} 
                  onChange={() => setTipoNumeroQc('manual')}
                  className="mt-1 text-blue-500 cursor-pointer"
                />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">
                      Modificar / Informar o número do QC
                    </span>
                    <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-semibold">
                      Manual
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Ideal quando outra pessoa realizou QCs externamente e você precisa registrar o número seguinte.
                  </p>

                  {tipoNumeroQc === 'manual' && (
                    <div className="pt-2 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Identificador do QC Personalizado:
                      </label>
                      <input 
                        type="text"
                        value={numeroQcManual}
                        onChange={(e) => setNumeroQcManual(e.target.value.toUpperCase())}
                        placeholder="Ex: QC-035 ou QC-2026-02"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-emerald-400 uppercase font-bold focus:outline-none focus:border-blue-500"
                        autoFocus
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setModalDefinirQcAberto(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmarGeracaoComNumero}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-600/25 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {acaoPendenteGeracao === 'excel' ? 'Confirmar e Baixar Excel' : 'Confirmar e Gerar QC'}
                </span>
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* 5. MODAL DE SOLICITAÇÃO DE AJUSTE DE PREÇO (ITENS PERDEDORES) */}
      {negociacaoModal && createPortal(
        <div className="fixed inset-0 top-0 left-0 w-screen h-screen z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col p-6 shadow-2xl space-y-4 animate-scaleUp">
            
            {/* Topo do Modal */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
                  <TrendingDown className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <span>Solicitar Ajuste de Preço</span>
                    <span className="text-amber-400 font-mono text-xs">({negociacaoModal.itens.length} itens)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Fornecedor: <strong className="text-slate-200">{negociacaoModal.orc.nomeFornecedor}</strong>
                    {negociacaoModal.orc.nomeContato && (
                      <span className="text-emerald-400 ml-1.5">• Contato: {negociacaoModal.orc.nomeContato}</span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setNegociacaoModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Informações de Contato do Vendedor */}
            <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
              <div className="flex items-center gap-4">
                <span className="text-slate-400">
                  Destinatário: <strong className="text-slate-200">{negociacaoModal.orc.emailContato || 'E-mail não informado'}</strong>
                </span>
                {(negociacaoModal.orc.celularContato || negociacaoModal.orc.telefoneContato) && (
                  <span className="text-slate-400">
                    Telefone/WhatsApp: <strong className="text-emerald-400 font-mono">{negociacaoModal.orc.celularContato || negociacaoModal.orc.telefoneContato}</strong>
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="text-[11px] text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30 font-semibold">
                  Alinhamento com Menor Concorrente
                </span>
              </div>
            </div>

            {/* Caixa de Texto do E-mail / Mensagem */}
            <div className="space-y-1.5 flex-1 flex flex-col min-h-[220px]">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Mensagem Comercial Gerada:</span>
                <span className="text-[11px] text-slate-500">Você pode editar o texto antes de enviar</span>
              </div>

              <textarea
                value={negociacaoModal.emailTexto}
                onChange={(e) => setNegociacaoModal({ ...negociacaoModal, emailTexto: e.target.value })}
                rows={10}
                className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 font-sans leading-relaxed focus:outline-none focus:border-blue-500 resize-none font-mono"
              />
            </div>

            {/* Ações: Copiar, WhatsApp e Abrir E-mail */}
            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleCopiarTextoNegociacao}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  {copiadoNegociacao ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Texto Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-400" />
                      <span>Copiar Mensagem</span>
                    </>
                  )}
                </button>

                {(negociacaoModal.orc.celularContato || negociacaoModal.orc.telefoneContato) && (
                  <button
                    onClick={() => {
                      const num = (negociacaoModal.orc.celularContato || negociacaoModal.orc.telefoneContato || '').replace(/\D/g, '');
                      const texto = encodeURIComponent(negociacaoModal.emailTexto);
                      window.open(`https://wa.me/55${num}?text=${texto}`, '_blank');
                    }}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    title="Enviar direto pelo WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => {
                  const dest = negociacaoModal.orc.emailContato || '';
                  const subject = encodeURIComponent(negociacaoModal.assunto);
                  const body = encodeURIComponent(negociacaoModal.emailTexto);
                  window.location.href = `mailto:${dest}?subject=${subject}&body=${body}`;
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Abrir no Seu E-mail</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 6. MODAL DE SOLICITAÇÃO DE EXCLUSÃO DE ITENS PERDEDORES (FECHAR VENCEDORES) */}
      {vencedoresModal && createPortal(
        <div className="fixed inset-0 top-0 left-0 w-screen h-screen z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col p-6 shadow-2xl space-y-4 animate-scaleUp overflow-y-auto">
            
            {/* Topo do Modal */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <span>Gerar Orçamento com Itens Vencedores</span>
                    <span className="text-emerald-400 font-mono text-xs">({vencedoresModal.itensVencedores.length} itens ganhos)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Fornecedor: <strong className="text-slate-200">{vencedoresModal.orc.nomeFornecedor}</strong>
                    {vencedoresModal.orc.numeroOrcamento && (
                      <span className="text-slate-300 font-mono ml-1.5">• Orçamento: № {vencedoresModal.orc.numeroOrcamento}</span>
                    )}
                    {vencedoresModal.orc.nomeContato && (
                      <span className="text-emerald-400 ml-1.5">• Contato: {vencedoresModal.orc.nomeContato}</span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setVencedoresModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Informações de Contato do Vendedor */}
            <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
              <div className="flex items-center gap-4">
                <span className="text-slate-400">
                  Destinatário: <strong className="text-slate-200">{vencedoresModal.orc.emailContato || 'E-mail não informado'}</strong>
                </span>
                {(vencedoresModal.orc.celularContato || vencedoresModal.orc.telefoneContato) && (
                  <span className="text-slate-400">
                    Telefone/WhatsApp: <strong className="text-emerald-400 font-mono">{vencedoresModal.orc.celularContato || vencedoresModal.orc.telefoneContato}</strong>
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="text-[11px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30 font-semibold">
                  Solicitação de Exclusão de Itens
                </span>
              </div>
            </div>

            {/* 1. OPÇÃO: GERAR QC COM ITENS VENCEDORES */}
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5 shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={vencedoresModal.gerarQc}
                    onChange={(e) => handleToggleGerarQc(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    Gerar QC com itens vencedores
                  </span>
                </label>
                <span className="text-[11px] text-amber-400 font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  {vencedoresModal.orc.nomeFornecedor}
                </span>
              </div>

              {vencedoresModal.gerarQc && (
                <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                      Identificação do Novo QC (com nome do fornecedor vencedor):
                    </label>
                    <input
                      type="text"
                      value={vencedoresModal.numeroQcVencedor}
                      onChange={(e) => handleMudarNumeroQcVencedor(e.target.value.toUpperCase())}
                      placeholder="Ex: QC-032-ELECON"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-amber-400 font-mono font-bold focus:border-emerald-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Aparecerá automaticamente abaixo do QC principal na página toda vez que abrir o comparativo.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleBaixarExcelVencedoresModal}
                    className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer self-end sm:self-center shrink-0"
                    title="Baixar planilha Excel formatada contendo exclusivamente os itens vencedores"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Baixar Planilha QC (.xlsx)</span>
                  </button>
                </div>
              )}
            </div>

            {/* 2. OPÇÃO: GERAR FATURAMENTO DIRETO (FD) VINCULADO */}
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5 shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={vencedoresModal.gerarFd}
                    onChange={(e) => handleToggleGerarFd(e.target.checked)}
                    className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <ReceiptText className="w-4 h-4 text-blue-400" />
                    Gerar Faturamento Direto (FD) Vinculado
                  </span>
                </label>
                <span className="text-[11px] text-blue-400 font-mono font-semibold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/30">
                  CONTROLE #{vencedoresModal.tipoNumeroFd === 'sequencial' ? vencedoresModal.proximoFdSequencial : (vencedoresModal.numeroFdManual || vencedoresModal.proximoFdSequencial)}
                </span>
              </div>

              {vencedoresModal.gerarFd && (
                <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Opção Sequencial */}
                    <div
                      onClick={() => handleMudarTipoNumeroFd('sequencial')}
                      className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                        vencedoresModal.tipoNumeroFd === 'sequencial'
                          ? 'bg-blue-600/15 border-blue-500/60 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="tipoNumeroFdVencedores"
                        checked={vencedoresModal.tipoNumeroFd === 'sequencial'}
                        onChange={() => handleMudarTipoNumeroFd('sequencial')}
                        className="w-4 h-4 accent-blue-500 cursor-pointer"
                      />
                      <div className="text-xs">
                        <span className="font-semibold block text-[11px] text-slate-300">Automático (Sequencial)</span>
                        <span className="font-mono text-blue-400 font-bold">CONTROLE {vencedoresModal.proximoFdSequencial}</span>
                      </div>
                    </div>

                    {/* Opção Manual */}
                    <div
                      onClick={() => handleMudarTipoNumeroFd('manual')}
                      className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                        vencedoresModal.tipoNumeroFd === 'manual'
                          ? 'bg-blue-600/15 border-blue-500/60 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="tipoNumeroFdVencedores"
                        checked={vencedoresModal.tipoNumeroFd === 'manual'}
                        onChange={() => handleMudarTipoNumeroFd('manual')}
                        className="w-4 h-4 accent-blue-500 cursor-pointer"
                      />
                      <div className="flex-1 text-xs">
                        <span className="font-semibold block text-[11px] text-slate-300">Informar Número Manual</span>
                        {vencedoresModal.tipoNumeroFd === 'manual' ? (
                          <input
                            type="text"
                            value={vencedoresModal.numeroFdManual}
                            onChange={(e) => handleMudarNumeroFdManual(e.target.value)}
                            placeholder={`Ex: ${vencedoresModal.proximoFdSequencial} ou FD-005`}
                            className="w-full mt-1 px-2.5 py-1 bg-slate-950 border border-blue-500/60 rounded-lg text-xs font-mono text-blue-300 font-bold focus:outline-none"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className="text-[10px] text-slate-500">Definir número manual</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                    <span className="text-[10px] text-slate-500">
                      Cria o registro em Faturamento Direto com a obra e itens ganhos, vinculado a este QC.
                    </span>
                    <button
                      type="button"
                      onClick={handleBaixarExcelFdModal}
                      className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0 self-end sm:self-center"
                      title="Baixar planilha Excel do Faturamento Direto"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-400" />
                      <span>Baixar Planilha FD (.xlsx)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* STATUS & BOTÃO DE SALVAR NO BANCO */}
            <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
              <div className="text-xs">
                {vencedoresModal.qcGeradoSucesso && vencedoresModal.fdGeradoSucesso ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    ✓ QC e Faturamento Direto salvos no sistema com sucesso!
                  </span>
                ) : vencedoresModal.qcGeradoSucesso ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    ✓ {vencedoresModal.numeroQcVencedor.trim().toUpperCase().startsWith('QC') ? vencedoresModal.numeroQcVencedor : `QC ${vencedoresModal.numeroQcVencedor}`} salvo no sistema!
                  </span>
                ) : vencedoresModal.fdGeradoSucesso ? (
                  <span className="text-blue-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    ✓ Faturamento Direto salvo no sistema!
                  </span>
                ) : (
                  <span className="text-slate-400 text-[11px]">
                    Salve no sistema para registrar os documentos na base de dados da obra.
                  </span>
                )}
              </div>

              {(!vencedoresModal.qcGeradoSucesso || (!vencedoresModal.fdGeradoSucesso && vencedoresModal.gerarFd)) && (vencedoresModal.gerarQc || vencedoresModal.gerarFd) && (
                <button
                  type="button"
                  onClick={handleConfirmarGerarTudoVencedor}
                  disabled={vencedoresModal.gerandoQc || vencedoresModal.gerandoFd}
                  className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer"
                >
                  {(vencedoresModal.gerandoQc || vencedoresModal.gerandoFd) ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Salvando no banco...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Salvar QC & FD no Banco</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Caixa de Texto do E-mail / Mensagem */}
            <div className="space-y-1.5 flex-1 flex flex-col min-h-[160px]">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Mensagem de Solicitação de Exclusão Gerada:</span>
                <span className="text-[11px] text-slate-500">Você pode editar o texto antes de enviar</span>
              </div>

              <textarea
                value={vencedoresModal.emailTexto}
                onChange={(e) => setVencedoresModal({ ...vencedoresModal, emailTexto: e.target.value })}
                rows={7}
                className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            {/* Ações: Copiar, WhatsApp e Abrir E-mail */}
            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleCopiarTextoVencedores}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  {copiadoVencedores ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Texto Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-400" />
                      <span>Copiar Mensagem</span>
                    </>
                  )}
                </button>

                {(vencedoresModal.orc.celularContato || vencedoresModal.orc.telefoneContato) && (
                  <button
                    onClick={async () => {
                      await ensureTudoGerado();
                      if (vencedoresModal.gerarQc) {
                        await handleBaixarExcelVencedoresModal();
                      }
                      if (vencedoresModal.gerarFd) {
                        await handleBaixarExcelFdModal();
                      }
                      const num = (vencedoresModal.orc.celularContato || vencedoresModal.orc.telefoneContato || '').replace(/\D/g, '');
                      const texto = encodeURIComponent(vencedoresModal.emailTexto);
                      window.open(`https://wa.me/55${num}?text=${texto}`, '_blank');
                      setSucessoQc(`Documentos salvos e planilha(s) baixada(s) para enviar no WhatsApp!`);
                    }}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    title="Enviar direto pelo WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </button>
                )}
              </div>

              <button
                onClick={async () => {
                  await ensureTudoGerado();
                  if (vencedoresModal.gerarQc) {
                    await handleBaixarExcelVencedoresModal();
                  }
                  if (vencedoresModal.gerarFd) {
                    await handleBaixarExcelFdModal();
                  }
                  const dest = vencedoresModal.orc.emailContato || '';
                  const subject = encodeURIComponent(vencedoresModal.assunto);
                  const body = encodeURIComponent(vencedoresModal.emailTexto);
                  window.location.href = `mailto:${dest}?subject=${subject}&body=${body}`;
                  setSucessoQc(`Documentos salvos e planilha(s) Excel (.xlsx) baixada(s) para anexar ao seu e-mail!`);
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Abrir no Seu E-mail (Anexar XLSX)</span>
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* 7. MODAL DE AVISO DE ORÇAMENTO DUPLICADO / JÁ VINCULADO A OUTRO QC */}
      {conflitoModal && createPortal(
        <div className="fixed inset-0 top-0 left-0 w-screen h-screen z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/50 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-scaleUp">
            
            <div className="flex items-start gap-3.5 pb-3 border-b border-slate-800">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/30 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30">
                    Aviso de Cotação no Banco
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-100 mt-1">
                  Orçamento já existente no {conflitoModal.numeroQuadro}
                </h3>
              </div>
              <button
                onClick={() => setConflitoModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-950/80 border border-slate-800/90 rounded-2xl space-y-2 text-xs">
              <p className="text-slate-300 leading-relaxed">
                Identificamos que o orçamento <strong className="text-amber-400 font-mono">nº {conflitoModal.numeroOrcamento}</strong> da empresa <strong className="text-slate-100">{conflitoModal.nomeFornecedor}</strong> já está cadastrado no <strong className="text-blue-400 font-mono">{conflitoModal.numeroQuadro}</strong> (elaborado em {conflitoModal.dataQc || 'data anterior'}).
              </p>
              <p className="text-slate-400 text-[11px] pt-1.5 border-t border-slate-800/60 leading-normal">
                {acaoPendente === 'excel'
                  ? 'Você prefere abrir o quadro existente ou deseja gerar um Novo QC e baixar o Excel com esta cotação?'
                  : 'Você prefere carregar o quadro existente montado na tela ou deseja gerar um Novo QC mesmo com esta cotação?'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setConflitoModal(null)}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => {
                  handleCarregarQc(conflitoModal.qcId);
                  setConflitoModal(null);
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 transition cursor-pointer"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Abrir o {conflitoModal.numeroQuadro}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const acao = acaoPendente;
                  setConflitoModal(null);
                  handleProcessarOrcamentos(acao, true, tipoNumeroQc === 'manual' ? numeroQcManual : undefined);
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{acaoPendente === 'excel' ? 'Gerar Novo QC e Baixar Excel' : 'Gerar Novo QC'}</span>
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* 8. MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE QC */}
      {modalExcluirQcAberto && qcParaExcluir && createPortal(
        <div className="fixed inset-0 top-0 left-0 w-screen h-screen z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-base">Excluir Quadro Comparativo</h3>
                <p className="text-xs text-slate-400">Ação irreversível</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Tem certeza que deseja excluir o <strong className="text-white font-mono">{qcParaExcluir.numero}</strong> desta obra?
            </p>

            <div className="p-3 bg-blue-950/40 border border-blue-800/40 rounded-xl text-[11px] text-blue-300 space-y-1">
              <p className="font-semibold text-blue-200">Atualização de Sequência:</p>
              <p>Ao excluir este QC, a numeração sequencial da obra será recalculada automaticamente para que a próxima cotação continue na sequência correta.</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setModalExcluirQcAberto(false);
                  setQcParaExcluir(null);
                }}
                disabled={excluindoQc}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={excluindoQc}
                onClick={handleConfirmarExclusaoQc}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-rose-600/25 disabled:opacity-50 cursor-pointer"
              >
                {excluindoQc ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirmar Exclusão</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

export default QCView;
