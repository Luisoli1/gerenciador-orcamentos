import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../services/api';
import type { FaturamentoDireto, ItemFaturamentoDireto, Qc, QuadroComparativoDto, Obra } from '../types';
import { 
  ReceiptText, 
  Plus, 
  FileSpreadsheet, 
  Printer, 
  Trash2, 
  Edit3, 
  Save, 
  RotateCcw, 
  Check, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Building2, 
  Hash, 
  Calendar, 
  Sparkles, 
  Trophy, 
  AlertTriangle,
  FolderOpen,
  HelpCircle,
  FileText,
  Search,
  ExternalLink,
  Send,
  Mail,
  Copy,
  Users,
  Star,
  Paperclip
} from 'lucide-react';

interface FaturamentoDiretoViewProps {
  obraId: number;
}

export function FaturamentoDiretoView({ obraId }: FaturamentoDiretoViewProps) {
  const [faturamentos, setFaturamentos] = useState<FaturamentoDireto[]>([]);
  const [selectedFdId, setSelectedFdId] = useState<number | null>(null);
  const [activeFd, setActiveFd] = useState<FaturamentoDireto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Lista de QCs da obra para geração
  const [qcsDaObra, setQcsDaObra] = useState<Qc[]>([]);
  const [obraInfo, setObraInfo] = useState<Obra | null>(null);

  // Modal de Criação a partir de QC
  const [modalNovoAberto, setModalNovoAberto] = useState<boolean>(false);
  const [selectedQcId, setSelectedQcId] = useState<number | null>(null);
  const [qcComparativo, setQcComparativo] = useState<QuadroComparativoDto | null>(null);
  const [fornecedorEscolhido, setFornecedorEscolhido] = useState<string>('');
  const [carregandoComparativo, setCarregandoComparativo] = useState<boolean>(false);

  // Opções de numeração de controle (Sequencial vs Manual)
  const [tipoNumeroControle, setTipoNumeroControle] = useState<'sequencial' | 'manual'>('sequencial');
  const [numeroControleManual, setNumeroControleManual] = useState<string>('');

  // Campos complementares da Obra e Fornecedor que podem faltar
  const [dadosCompFornecedorEndereco, setDadosCompFornecedorEndereco] = useState('');
  const [dadosCompFornecedorCep, setDadosCompFornecedorCep] = useState('');
  const [dadosCompClienteEndereco, setDadosCompClienteEndereco] = useState('');
  const [dadosCompClienteCep, setDadosCompClienteCep] = useState('');
  const [dadosCompClienteTelefone, setDadosCompClienteTelefone] = useState('');
  const [dadosCompClienteEmail, setDadosCompClienteEmail] = useState('');
  const [dadosCompClienteContato, setDadosCompClienteContato] = useState('');
  const [dadosCompEntregaEndereco, setDadosCompEntregaEndereco] = useState('');
  const [dadosCompEntregaCep, setDadosCompEntregaCep] = useState('');
  const [dadosCompNumeroContrato, setDadosCompNumeroContrato] = useState('');
  const [gerandoFd, setGerandoFd] = useState<boolean>(false);

  // Modo de Edição Inline do FD
  const [modoEdicao, setModoEdicao] = useState<boolean>(false);
  const [fdEditavel, setFdEditavel] = useState<FaturamentoDireto | null>(null);
  const [salvandoEdicao, setSalvandoEdicao] = useState<boolean>(false);

  // Modal de Exclusão
  const [modalExcluirAberto, setModalExcluirAberto] = useState<boolean>(false);
  const [excluindo, setExcluindo] = useState<boolean>(false);

  // Modal de Envio por E-mail para Cliente (Engenheiros da Obra)
  const [modalEmailAberto, setModalEmailAberto] = useState<boolean>(false);
  const [emailDestinatario, setEmailDestinatario] = useState<string>('');
  const [emailNomeEngenheiro, setEmailNomeEngenheiro] = useState<string>('');
  const [emailCopia, setEmailCopia] = useState<string>('');
  const [emailAssunto, setEmailAssunto] = useState<string>('');
  const [emailCorpo, setEmailCorpo] = useState<string>('');
  const [emailCopiado, setEmailCopiado] = useState<boolean>(false);

  // Carregar dados iniciais da Obra e FDs
  const carregarDados = async () => {
    setLoading(true);
    setError(null);
    try {
      const [listaFds, listaQcs, listaObras] = await Promise.all([
        api.listarFaturamentosDiretos(obraId),
        api.listarQcsPorObra(obraId),
        api.listarObras()
      ]);

      const fds = Array.isArray(listaFds) ? listaFds : [];
      setFaturamentos(fds);
      setQcsDaObra(Array.isArray(listaQcs) ? listaQcs : []);

      const ob = (Array.isArray(listaObras) ? listaObras : []).find(o => o.id === obraId);
      if (ob) setObraInfo(ob);

      if (fds.length > 0) {
        setSelectedFdId(prev => (prev && fds.some(f => f.id === prev)) ? prev : fds[0].id!);
      } else {
        setSelectedFdId(null);
        setActiveFd(null);
      }
    } catch (err: any) {
      console.error("Erro ao carregar Faturamentos Diretos:", err);
      setError("Erro ao carregar os Faturamentos Diretos da obra.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [obraId]);

  // Carregar FD selecionado
  useEffect(() => {
    if (selectedFdId) {
      const fd = faturamentos.find(f => f.id === selectedFdId);
      if (fd) {
        setActiveFd(fd);
        setModoEdicao(false);
        setFdEditavel(null);
      }
    } else {
      setActiveFd(null);
    }
  }, [selectedFdId, faturamentos]);

  // Cálculo do Próximo Número de Controle Sequencial
  const proximoControleSugerido = useMemo(() => {
    let maxNum = 0;
    faturamentos.forEach(f => {
      if (f.numeroControle) {
        const dig = f.numeroControle.replace(/\D/g, '');
        if (dig) {
          const val = parseInt(dig, 10);
          if (val > maxNum) maxNum = val;
        }
      }
    });
    return String(maxNum + 1).padStart(3, '0');
  }, [faturamentos]);

  // Carregar comparativo quando selecionar QC no modal
  const handleSelecionarQcModal = async (qcId: number) => {
    setSelectedQcId(qcId);
    setCarregandoComparativo(true);
    try {
      const comp = await api.buscarQcComparativo(qcId);
      setQcComparativo(comp);
      if (comp.orcamentos && comp.orcamentos.length > 0) {
        // Pré-seleciona o vencedor se houver, ou o primeiro
        const venc = comp.fornecedorVencedor;
        const temVencedor = comp.orcamentos.find(o => o.nomeFornecedor === venc);
        setFornecedorEscolhido(temVencedor ? temVencedor.nomeFornecedor : comp.orcamentos[0].nomeFornecedor);
      }
    } catch (err) {
      console.error("Erro ao carregar comparativo:", err);
    } finally {
      setCarregandoComparativo(false);
    }
  };

  // Abrir Modal de Geração de FD
  const handleAbrirModalNovo = () => {
    setModalNovoAberto(true);
    setTipoNumeroControle('sequencial');
    setNumeroControleManual(proximoControleSugerido);
    setDadosCompFornecedorEndereco('');
    setDadosCompFornecedorCep('');
    setDadosCompClienteEndereco(obraInfo?.enderecoObra || '');
    setDadosCompClienteCep(obraInfo?.cepObra || '');
    setDadosCompClienteTelefone(obraInfo?.telefoneCliente || '');
    setDadosCompClienteEmail(obraInfo?.emailCliente || '');
    setDadosCompClienteContato(obraInfo?.contatoCliente || '');
    setDadosCompEntregaEndereco(obraInfo?.enderecoEntrega || obraInfo?.enderecoObra || '');
    setDadosCompEntregaCep(obraInfo?.cepEntrega || obraInfo?.cepObra || '');
    setDadosCompNumeroContrato(obraInfo?.numeroContrato || '');

    if (qcsDaObra.length > 0) {
      handleSelecionarQcModal(qcsDaObra[0].id);
    }
  };

  // Submeter Geração de FD
  const handleConfirmarGerarFd = async () => {
    if (!selectedQcId || !fornecedorEscolhido) {
      setError("Selecione um QC e o fornecedor para gerar o Faturamento Direto.");
      return;
    }

    const numControle = tipoNumeroControle === 'sequencial'
      ? proximoControleSugerido
      : (numeroControleManual.trim() || proximoControleSugerido);

    setGerandoFd(true);
    try {
      const novoFd = await api.gerarFaturamentoDiretoDeQc({
        qcId: selectedQcId,
        fornecedorNome: fornecedorEscolhido,
        numeroControle: numControle,
        dadosComplementares: {
          fornecedorEndereco: dadosCompFornecedorEndereco.trim() || undefined,
          fornecedorCep: dadosCompFornecedorCep.trim() || undefined,
          clienteEndereco: dadosCompClienteEndereco.trim() || undefined,
          clienteCep: dadosCompClienteCep.trim() || undefined,
          clienteTelefone: dadosCompClienteTelefone.trim() || undefined,
          clienteEmail: dadosCompClienteEmail.trim() || undefined,
          clienteContato: dadosCompClienteContato.trim() || undefined,
          entregaEndereco: dadosCompEntregaEndereco.trim() || undefined,
          entregaCep: dadosCompEntregaCep.trim() || undefined,
          numeroContrato: dadosCompNumeroContrato.trim() || undefined,
        }
      });

      setFaturamentos(prev => [novoFd, ...prev]);
      setSelectedFdId(novoFd.id!);
      setActiveFd(novoFd);
      setModalNovoAberto(false);
      setSuccess(`Faturamento Direto CONTROLE ${novoFd.numeroControle} gerado com sucesso!`);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error("Erro ao gerar Faturamento Direto:", err);
      setError("Erro ao gerar Faturamento Direto no servidor.");
    } finally {
      setGerandoFd(false);
    }
  };

  // --- MODO DE EDIÇÃO INLINE DO FD ---
  const handleIniciarEdicao = () => {
    if (!activeFd) return;
    setFdEditavel(JSON.parse(JSON.stringify(activeFd)));
    setModoEdicao(true);
  };

  const handleCancelarEdicao = () => {
    setFdEditavel(null);
    setModoEdicao(false);
  };

  // Recalcular totais após edição de item
  const recalcularTotaisFd = (fd: FaturamentoDireto): FaturamentoDireto => {
    let tot = 0;
    (fd.itens || []).forEach(it => {
      const q = Number(it.quantidade) || 0;
      const pu = Number(it.precoUnitario) || 0;
      it.valorTotal = q * pu;
      tot += it.valorTotal;
    });
    fd.valorTotalGeral = tot;
    return { ...fd };
  };

  const handleAlterarItemFd = (itemSeq: number, campo: keyof ItemFaturamentoDireto, valor: any) => {
    if (!fdEditavel) return;
    const clone: FaturamentoDireto = JSON.parse(JSON.stringify(fdEditavel));
    const item = (clone.itens || []).find(i => i.itemSeq === itemSeq);
    if (item) {
      (item as any)[campo] = valor;
    }
    setFdEditavel(recalcularTotaisFd(clone));
  };

  const handleSalvarEdicao = async () => {
    if (!fdEditavel || !fdEditavel.id) return;
    setSalvandoEdicao(true);
    try {
      const atualizado = await api.atualizarFaturamentoDireto(fdEditavel.id, fdEditavel);
      setActiveFd(atualizado);
      setFaturamentos(prev => prev.map(f => f.id === atualizado.id ? atualizado : f));
      setModoEdicao(false);
      setFdEditavel(null);
      setSuccess("Faturamento Direto atualizado com sucesso no banco de dados!");
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error("Erro ao atualizar FD:", err);
      setError("Erro ao salvar alterações no Faturamento Direto.");
    } finally {
      setSalvandoEdicao(false);
    }
  };

  // Exclusão de FD
  const handleExcluirFd = async () => {
    if (!activeFd || !activeFd.id) return;
    setExcluindo(true);
    try {
      await api.deletarFaturamentoDireto(activeFd.id);
      setFaturamentos(prev => prev.filter(f => f.id !== activeFd.id));
      setSelectedFdId(null);
      setActiveFd(null);
      setModalExcluirAberto(false);
      setSuccess("Faturamento Direto excluído com sucesso.");
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error("Erro ao excluir FD:", err);
      setError("Erro ao excluir Faturamento Direto.");
    } finally {
      setExcluindo(false);
    }
  };

  // Download do Excel
  const handleDownloadExcel = async () => {
    if (!activeFd || !activeFd.id) return;
    try {
      await api.downloadExcelFaturamentoDireto(activeFd.id, activeFd.numeroControle);
    } catch (err) {
      console.error("Erro ao baixar Excel do FD:", err);
      setError("Não foi possível baixar o Excel do Faturamento Direto.");
    }
  };

  // Envio por E-mail para Engenheiros da Construtora
  const handleAbrirModalEmail = () => {
    if (!currentDisplay) return;

    // Obter dados da Obra atual e engenheiros
    const obraAtual = currentDisplay.obra || obraInfo;
    const engs = obraAtual?.engenheiros || [];
    const engPrincipal = engs.find(e => e.principal) || (engs.length > 0 ? engs[0] : null);
    const outrosEngs = engs.filter(e => e !== engPrincipal && e.email);

    const nomeEng = engPrincipal?.nome || currentDisplay.clienteContato || 'Engenheiro';
    const emailPrincipal = engPrincipal?.email || currentDisplay.clienteEmail || '';
    const emailsCc = outrosEngs.map(e => e.email).filter(Boolean).join(', ');

    // Número do QC
    let numQc = '001';
    if (currentDisplay.qc?.numeroQuadro) {
      numQc = currentDisplay.qc.numeroQuadro;
    } else if (selectedQcId) {
      const q = qcsDaObra.find(item => item.id === selectedQcId);
      if (q?.numeroQuadro) numQc = q.numeroQuadro;
    } else if (qcsDaObra.length > 0) {
      numQc = qcsDaObra[0].numeroQuadro;
    }

    const numFd = currentDisplay.numeroControle || '001';
    const nomeDaObra = obraAtual?.nomeObra || currentDisplay.entregaObra || `Obra #${obraId}`;

    // Normaliza para nunca ter repetição tipo "QC QC-032" ou "FD FD-001"
    const cleanNumQc = numQc.trim().replace(/^QC[-\s]*/i, '');
    const cleanNumFd = numFd.trim().replace(/^FD[-\s]*/i, '');
    const qcFormatado = `QC ${cleanNumQc}`;
    const fdFormatado = `FD ${cleanNumFd}`;

    // Assunto padronizado solicitado: Solicitação aprovação QC XX - FD XX // NomeObra
    const assunto = `Solicitação aprovação ${qcFormatado} - ${fdFormatado} // ${nomeDaObra}`;

    // Mensagem padronizada solicitada:
    const corpo = `Prezado(a) ${nomeEng},

Segue pedido para aprovação - ${qcFormatado}, Faturamento Direto ${cleanNumFd}.

Aguardo aprovação para dar sequência com fornecedor.

Atenciosamente,
Makinsthal Engenharia`;

    setEmailNomeEngenheiro(nomeEng);
    setEmailDestinatario(emailPrincipal);
    setEmailCopia(emailsCc);
    setEmailAssunto(assunto);
    setEmailCorpo(corpo);
    setEmailCopiado(false);
    setModalEmailAberto(true);
  };

  const handleEnviarViaMailto = () => {
    const to = encodeURIComponent(emailDestinatario.trim());
    const cc = emailCopia.trim() ? encodeURIComponent(emailCopia.trim()) : '';
    const su = encodeURIComponent(emailAssunto.trim());
    const body = encodeURIComponent(emailCorpo);

    let url = `mailto:${to}?subject=${su}&body=${body}`;
    if (cc) {
      url += `&cc=${cc}`;
    }
    window.location.href = url;
  };

  const handleAbrirGmail = () => {
    const to = encodeURIComponent(emailDestinatario.trim());
    const cc = emailCopia.trim() ? encodeURIComponent(emailCopia.trim()) : '';
    const su = encodeURIComponent(emailAssunto.trim());
    const body = encodeURIComponent(emailCorpo);

    let url = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${su}&body=${body}`;
    if (cc) {
      url += `&cc=${cc}`;
    }
    window.open(url, '_blank');
  };

  const handleCopiarTextoEmail = () => {
    const texto = `Para: ${emailDestinatario}\n${emailCopia ? `Cc: ${emailCopia}\n` : ''}Assunto: ${emailAssunto}\n\n${emailCorpo}`;
    navigator.clipboard.writeText(texto);
    setEmailCopiado(true);
    setTimeout(() => setEmailCopiado(false), 3000);
  };

  const currentDisplay = modoEdicao && fdEditavel ? fdEditavel : activeFd;

  const fmt = (v?: number | null) => {
    if (v === null || v === undefined) return 'R$ 0,00';
    return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
      
      {/* Alertas Flutuantes */}
      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-400 hover:text-emerald-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Topo / Barra de Ações */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-blue-600/10 text-blue-400 rounded-2xl border border-blue-500/20 shadow-inner">
            <ReceiptText className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
              Faturamento Direto - Pedido de Compra Vinculada
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Obra: <strong className="text-slate-200">{obraInfo?.nomeObra || `Obra #${obraId}`}</strong> • Geração de pedidos com faturamento direto ao cliente
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Seletor de FD já gerado */}
          {faturamentos.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Controle:</span>
              <select
                value={selectedFdId || ''}
                onChange={(e) => setSelectedFdId(Number(e.target.value))}
                disabled={modoEdicao}
                className="bg-slate-950 border border-slate-700 hover:border-blue-500 text-slate-200 text-xs rounded-xl px-3 py-2 font-mono font-bold focus:outline-none focus:border-blue-500 cursor-pointer disabled:opacity-50"
              >
                {faturamentos.map(f => (
                  <option key={f.id} value={f.id}>
                    CONTROLE {f.numeroControle} - {f.fornecedorNome} ({fmt(f.valorTotalGeral)})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={carregarDados}
            disabled={loading || modoEdicao}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition disabled:opacity-50"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleAbrirModalNovo}
            disabled={modoEdicao}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-600/25 active:scale-95 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Gerar Faturamento Direto</span>
          </button>
        </div>
      </div>

      {/* Conteúdo Principal do Documento ou Estado Vazio */}
      {currentDisplay ? (
        <div className="space-y-4">
          
          {/* Barra Superior do Documento com Ações (Atualizar FD, Excel, Imprimir, Excluir) */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-300">Documento Ativo:</span>
              <span className="font-mono font-black text-sm bg-yellow-400 text-slate-950 px-2.5 py-0.5 rounded shadow-sm">
                CONTROLE {currentDisplay.numeroControle}
              </span>
              <span className="text-xs text-slate-400">
                Fornecedor: <strong className="text-slate-200">{currentDisplay.fornecedorNome}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {!modoEdicao ? (
                <>
                  <button
                    onClick={handleIniciarEdicao}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-blue-600/20"
                    title="Editar campos e valores deste Faturamento Direto"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Atualizar FD</span>
                  </button>

                  <button
                    onClick={handleDownloadExcel}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/20"
                    title="Baixar planilha idêntica em Excel"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Baixar Excel</span>
                  </button>

                  <button
                    onClick={handleAbrirModalEmail}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/20 active:scale-95"
                    title="Enviar e-mail para aprovação do cliente (engenheiros da construtora)"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar p/ Cliente</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition border border-slate-700"
                    title="Imprimir documento ou salvar como PDF"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir / PDF</span>
                  </button>

                  <button
                    onClick={() => setModalExcluirAberto(true)}
                    className="p-1.5 bg-slate-800 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-xl transition border border-slate-700"
                    title="Excluir este Faturamento Direto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSalvarEdicao}
                    disabled={salvandoEdicao}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-600/25 disabled:opacity-50"
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
                    onClick={handleCancelarEdicao}
                    disabled={salvandoEdicao}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition border border-slate-700"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancelar</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Aviso Flutuante de Modo de Edição Ativo */}
          {modoEdicao && (
            <div className="bg-amber-500/10 border border-amber-500/40 text-amber-300 p-3.5 rounded-2xl flex items-center justify-between text-xs animate-fade-in shadow-inner">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                <span><strong>Modo de Edição Ativo: </strong>Todos os campos, itens, quantidades e preços estão liberados para alteração direta. O total geral é recalculado instantaneamente.</span>
              </div>
            </div>
          )}

          {/* FOLHA / DOCUMENTO IDÊNTICO ÀS IMAGENS FORNECIDAS PELO USUÁRIO */}
          <div className="bg-white text-slate-900 border-2 border-slate-900 rounded-xl shadow-2xl p-6 sm:p-8 space-y-4 print:p-0 print:border-none print:shadow-none text-xs font-sans">
            
            {/* 1. TÍTULO SUPERIOR */}
            <div className="border border-slate-900 text-center py-2 font-bold text-sm tracking-wider uppercase bg-slate-50">
              FATURAMENTO DIRETO  -  PEDIDO DE COMPRA VINCULADA
            </div>

            {/* 2. LOGO CLIENTE E CAIXA AMARELA CONTROLE */}
            <div className="grid grid-cols-12 border border-slate-900">
              <div className="col-span-8 p-4 flex items-center gap-3 border-r border-slate-900">
                <Building2 className="w-8 h-8 text-slate-700" />
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900 uppercase tracking-tight">
                    {currentDisplay.clienteEmpresa || obraInfo?.nomeCliente || 'CONTRATANTE'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Obra: {currentDisplay.entregaObra || obraInfo?.nomeObra}
                  </p>
                </div>
              </div>

              <div className="col-span-4 bg-yellow-400 p-3 flex flex-col justify-center items-center text-center">
                <span className="text-[11px] font-bold tracking-widest text-slate-900">CONTROLE</span>
                {modoEdicao ? (
                  <input
                    type="text"
                    value={currentDisplay.numeroControle}
                    onChange={(e) => setFdEditavel({ ...currentDisplay, numeroControle: e.target.value.toUpperCase() })}
                    className="text-2xl font-black text-slate-950 font-mono text-center bg-white/80 border border-slate-900 rounded px-1 w-28 uppercase"
                  />
                ) : (
                  <span className="text-3xl font-black text-slate-950 font-mono tracking-wider">
                    {currentDisplay.numeroControle}
                  </span>
                )}
                <div className="text-[10px] text-slate-800 mt-1 font-medium">
                  Data Elaboração/Revisão: {currentDisplay.dataElaboracao || '04/2024'} • Rev: {currentDisplay.revisao || '00'}
                </div>
              </div>
            </div>

            {/* 3. DADOS DE CONTRATO E CHECKBOXES */}
            <div className="border border-slate-900 grid grid-cols-12 divide-x divide-slate-900 text-[11px]">
              <div className="col-span-8 p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-bold">Contrato de: </span>
                    {modoEdicao ? (
                      <input 
                        type="text" 
                        value={currentDisplay.contratoDe || ''} 
                        onChange={(e) => setFdEditavel({ ...currentDisplay, contratoDe: e.target.value })}
                        className="border border-slate-400 px-1 py-0.5 rounded text-xs w-full"
                      />
                    ) : (
                      <span>{currentDisplay.contratoDe}</span>
                    )}
                  </div>
                  <div>
                    <span className="font-bold">Nº do contrato: </span>
                    {modoEdicao ? (
                      <input 
                        type="text" 
                        value={currentDisplay.numeroContrato || ''} 
                        onChange={(e) => setFdEditavel({ ...currentDisplay, numeroContrato: e.target.value })}
                        className="border border-slate-400 px-1 py-0.5 rounded text-xs w-full"
                      />
                    ) : (
                      <span>{currentDisplay.numeroContrato || '-'}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-300 text-[10px]">
                  <div>Fornecedor: ____________ Data: ___/___</div>
                  <div>Contratada: ____________ Data: ___/___</div>
                  <div>Contratante: ____________ Data: ___/___</div>
                </div>
              </div>

              <div className="col-span-4 p-3 flex flex-col justify-center space-y-1.5 text-xs font-semibold bg-slate-50">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={!!currentDisplay.fornecedorCadastrado} 
                    onChange={(e) => modoEdicao && setFdEditavel({ ...currentDisplay, fornecedorCadastrado: e.target.checked })}
                    disabled={!modoEdicao}
                    className="rounded text-blue-600"
                  />
                  <span>Fornecedor cadastrado.</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={!!currentDisplay.fornecedorVinculado} 
                    onChange={(e) => modoEdicao && setFdEditavel({ ...currentDisplay, fornecedorVinculado: e.target.checked })}
                    disabled={!modoEdicao}
                    className="rounded text-blue-600"
                  />
                  <span>Fornecedor vinculado.</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={!!currentDisplay.saldoOk} 
                    onChange={(e) => modoEdicao && setFdEditavel({ ...currentDisplay, saldoOk: e.target.checked })}
                    disabled={!modoEdicao}
                    className="rounded text-blue-600"
                  />
                  <span>Saldo OK</span>
                </label>
              </div>
            </div>

            {/* 4. OBSERVAÇÕES EM VERMELHO */}
            <div className="border border-slate-900 p-2.5 text-red-600 font-medium text-[11px] leading-relaxed bg-red-50/30">
              <strong className="underline">Observações :</strong> {currentDisplay.observacoes}
            </div>

            {/* 5. TABELA DE BLOCOS DE DADOS */}
            <div className="space-y-3">
              
              {/* BLOCO 1: DADOS DO FORNECEDOR TERCEIRO */}
              <div className="border border-slate-900">
                <div className="bg-slate-200 border-b border-slate-900 px-3 py-1 font-bold text-center uppercase tracking-wider text-[11px]">
                  DADOS DO FORNECEDOR TERCEIRO (FATURAMENTO DIRETO)
                </div>
                <div className="p-2.5 grid grid-cols-12 gap-y-1.5 gap-x-3 text-[11px]">
                  <div className="col-span-8 flex items-center gap-1">
                    <span className="font-bold w-16 shrink-0">Empresa:</span>
                    <span className="font-semibold truncate">{currentDisplay.fornecedorNome}</span>
                  </div>
                  <div className="col-span-4 flex items-center gap-1">
                    <span className="font-bold w-12 shrink-0">CNPJ:</span>
                    <span className="font-mono">{currentDisplay.fornecedorCnpj || '-'}</span>
                  </div>

                  <div className="col-span-8 flex items-center gap-1">
                    <span className="font-bold w-16 shrink-0">Endereço:</span>
                    {modoEdicao ? (
                      <input 
                        type="text" 
                        value={currentDisplay.fornecedorEndereco || ''} 
                        onChange={(e) => setFdEditavel({ ...currentDisplay, fornecedorEndereco: e.target.value })}
                        className="border border-slate-400 px-1 py-0.5 rounded w-full text-xs"
                      />
                    ) : (
                      <span className="truncate">{currentDisplay.fornecedorEndereco || '-'}</span>
                    )}
                  </div>
                  <div className="col-span-4 flex items-center gap-1">
                    <span className="font-bold w-12 shrink-0">CEP:</span>
                    {modoEdicao ? (
                      <input 
                        type="text" 
                        value={currentDisplay.fornecedorCep || ''} 
                        onChange={(e) => setFdEditavel({ ...currentDisplay, fornecedorCep: e.target.value })}
                        className="border border-slate-400 px-1 py-0.5 rounded w-full text-xs font-mono"
                      />
                    ) : (
                      <span className="font-mono">{currentDisplay.fornecedorCep || '-'}</span>
                    )}
                  </div>

                  <div className="col-span-6 flex items-center gap-1">
                    <span className="font-bold w-16 shrink-0">e-mail:</span>
                    <span className="truncate text-blue-600">{currentDisplay.fornecedorEmail || '-'}</span>
                  </div>
                  <div className="col-span-3 flex items-center gap-1">
                    <span className="font-bold w-16 shrink-0">Telefone:</span>
                    <span className="font-mono">{currentDisplay.fornecedorTelefone || '-'}</span>
                  </div>
                  <div className="col-span-3 flex items-center gap-1">
                    <span className="font-bold w-14 shrink-0">Contato:</span>
                    <span>{currentDisplay.fornecedorContato || '-'}</span>
                  </div>
                </div>
              </div>

              {/* BLOCO 2: DADOS DE FATURAMENTO (EMPRESA CONTRATANTE) */}
              <div className="border border-slate-900">
                <div className="bg-slate-200 border-b border-slate-900 px-3 py-1 font-bold text-center uppercase tracking-wider text-[11px]">
                  DADOS DE FATURAMENTO (EMPRESA CONTRATANTE)
                </div>
                <div className="p-2.5 grid grid-cols-12 gap-y-1.5 gap-x-3 text-[11px]">
                  <div className="col-span-8 flex items-center gap-1">
                    <span className="font-bold w-24 shrink-0">Empresa:</span>
                    <span className="font-semibold truncate">{currentDisplay.clienteEmpresa}</span>
                  </div>
                  <div className="col-span-4 flex items-center gap-1">
                    <span className="font-bold w-12 shrink-0">CNPJ:</span>
                    <span className="font-mono">{currentDisplay.clienteCnpj || '-'}</span>
                  </div>

                  <div className="col-span-8 flex items-center gap-1">
                    <span className="font-bold w-24 shrink-0">Endereço Obra:</span>
                    {modoEdicao ? (
                      <input 
                        type="text" 
                        value={currentDisplay.clienteEndereco || ''} 
                        onChange={(e) => setFdEditavel({ ...currentDisplay, clienteEndereco: e.target.value })}
                        className="border border-slate-400 px-1 py-0.5 rounded w-full text-xs"
                      />
                    ) : (
                      <span className="truncate">{currentDisplay.clienteEndereco || '-'}</span>
                    )}
                  </div>
                  <div className="col-span-4 flex items-center gap-1">
                    <span className="font-bold w-12 shrink-0">CEP:</span>
                    {modoEdicao ? (
                      <input 
                        type="text" 
                        value={currentDisplay.clienteCep || ''} 
                        onChange={(e) => setFdEditavel({ ...currentDisplay, clienteCep: e.target.value })}
                        className="border border-slate-400 px-1 py-0.5 rounded w-full text-xs font-mono"
                      />
                    ) : (
                      <span className="font-mono">{currentDisplay.clienteCep || '-'}</span>
                    )}
                  </div>

                  <div className="col-span-6 flex items-center gap-1">
                    <span className="font-bold w-24 shrink-0">e-mail:</span>
                    <span className="truncate text-blue-600">{currentDisplay.clienteEmail || '-'}</span>
                  </div>
                  <div className="col-span-3 flex items-center gap-1">
                    <span className="font-bold w-16 shrink-0">Telefone:</span>
                    <span className="font-mono">{currentDisplay.clienteTelefone || '-'}</span>
                  </div>
                  <div className="col-span-3 flex items-center gap-1">
                    <span className="font-bold w-14 shrink-0">Contato:</span>
                    <span>{currentDisplay.clienteContato || '-'}</span>
                  </div>
                </div>
              </div>

              {/* BLOCO 3: DADOS DA EMPRESA CONTRATADA (FORNECEDOR PRINCIPAL - MAKINSTHAL) */}
              <div className="border border-slate-900">
                <div className="bg-slate-200 border-b border-slate-900 px-3 py-1 font-bold text-center uppercase tracking-wider text-[11px]">
                  DADOS DA EMPRESA CONTRATADA (FORNECEDOR PRINCIPAL)
                </div>
                <div className="p-2.5 grid grid-cols-12 gap-y-1.5 gap-x-3 text-[11px]">
                  <div className="col-span-8 flex items-center gap-1">
                    <span className="font-bold w-16 shrink-0">Empresa:</span>
                    <span className="font-semibold">{currentDisplay.contratadaEmpresa}</span>
                  </div>
                  <div className="col-span-4 flex items-center gap-1">
                    <span className="font-bold w-12 shrink-0">CNPJ:</span>
                    <span className="font-mono">{currentDisplay.contratadaCnpj}</span>
                  </div>

                  <div className="col-span-8 flex items-center gap-1">
                    <span className="font-bold w-16 shrink-0">Endereço:</span>
                    <span>{currentDisplay.contratadaEndereco}</span>
                  </div>
                  <div className="col-span-4 flex items-center gap-1">
                    <span className="font-bold w-12 shrink-0">CEP:</span>
                    <span className="font-mono">{currentDisplay.contratadaCep}</span>
                  </div>

                  <div className="col-span-8 flex items-center gap-1">
                    <span className="font-bold w-16 shrink-0">e-mail:</span>
                    <span className="text-blue-600">{currentDisplay.contratadaEmail}</span>
                  </div>
                  <div className="col-span-4 flex items-center gap-1">
                    <span className="font-bold w-16 shrink-0">Telefone:</span>
                    <span className="font-mono">{currentDisplay.contratadaTelefone}</span>
                  </div>
                </div>
              </div>

              {/* BLOCO 4: DADOS PARA ENTREGA DO MATERIAL */}
              <div className="border border-slate-900">
                <div className="bg-slate-200 border-b border-slate-900 px-3 py-1 font-bold text-center uppercase tracking-wider text-[11px]">
                  DADOS PARA ENTREGA DO MATERIAL
                </div>
                <div className="p-2.5 grid grid-cols-12 gap-y-1.5 gap-x-3 text-[11px]">
                  <div className="col-span-8 flex items-center gap-1">
                    <span className="font-bold w-16 shrink-0">Obra:</span>
                    <span className="font-semibold truncate">{currentDisplay.entregaObra}</span>
                  </div>
                  <div className="col-span-4 flex items-center gap-1">
                    <span className="font-bold w-12 shrink-0">CNPJ:</span>
                    <span className="font-mono">{currentDisplay.entregaCnpj || '-'}</span>
                  </div>

                  <div className="col-span-8 flex items-center gap-1">
                    <span className="font-bold w-16 shrink-0">Endereço:</span>
                    {modoEdicao ? (
                      <input 
                        type="text" 
                        value={currentDisplay.entregaEndereco || ''} 
                        onChange={(e) => setFdEditavel({ ...currentDisplay, entregaEndereco: e.target.value })}
                        className="border border-slate-400 px-1 py-0.5 rounded w-full text-xs"
                      />
                    ) : (
                      <span className="truncate">{currentDisplay.entregaEndereco || '-'}</span>
                    )}
                  </div>
                  <div className="col-span-4 flex items-center gap-1">
                    <span className="font-bold w-12 shrink-0">CEP:</span>
                    {modoEdicao ? (
                      <input 
                        type="text" 
                        value={currentDisplay.entregaCep || ''} 
                        onChange={(e) => setFdEditavel({ ...currentDisplay, entregaCep: e.target.value })}
                        className="border border-slate-400 px-1 py-0.5 rounded w-full text-xs font-mono"
                      />
                    ) : (
                      <span className="font-mono">{currentDisplay.entregaCep || '-'}</span>
                    )}
                  </div>

                  <div className="col-span-6 flex items-center gap-1">
                    <span className="font-bold w-16 shrink-0">e-mail:</span>
                    <span className="truncate text-blue-600">{currentDisplay.entregaEmail || '-'}</span>
                  </div>
                  <div className="col-span-3 flex items-center gap-1">
                    <span className="font-bold w-16 shrink-0">Telefone:</span>
                    <span className="font-mono">{currentDisplay.entregaTelefone || '-'}</span>
                  </div>
                  <div className="col-span-3 flex items-center gap-1">
                    <span className="font-bold w-14 shrink-0">Contato:</span>
                    <span>{currentDisplay.entregaContato || '-'}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* 6. TABELA DE ITENS COM VALORES */}
            <div className="border border-slate-900 mt-4 overflow-hidden">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-900 font-bold text-slate-800">
                    <th className="p-2 border-r border-slate-900 min-w-[280px]">Descrição - Materiais</th>
                    <th className="p-2 border-r border-slate-900 text-center w-16">Unid.</th>
                    <th className="p-2 border-r border-slate-900 text-center w-16">Qtde.</th>
                    <th className="p-2 border-r border-slate-900 text-right w-28">Preço Unit. R$</th>
                    <th className="p-2 text-right w-32">Total R$</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {currentDisplay.itens && currentDisplay.itens.length > 0 ? (
                    currentDisplay.itens.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        {/* Descrição */}
                        <td className="p-2 border-r border-slate-900 font-medium">
                          {modoEdicao ? (
                            <input 
                              type="text"
                              value={item.descricao}
                              onChange={(e) => handleAlterarItemFd(item.itemSeq || idx + 1, 'descricao', e.target.value)}
                              className="w-full border border-slate-300 px-1.5 py-0.5 rounded text-xs"
                            />
                          ) : (
                            item.descricao
                          )}
                        </td>

                        {/* Unidade */}
                        <td className="p-2 border-r border-slate-900 text-center">
                          {modoEdicao ? (
                            <input 
                              type="text"
                              value={item.unidade}
                              onChange={(e) => handleAlterarItemFd(item.itemSeq || idx + 1, 'unidade', e.target.value.toUpperCase())}
                              className="w-12 border border-slate-300 px-1 py-0.5 rounded text-center text-xs uppercase"
                            />
                          ) : (
                            item.unidade
                          )}
                        </td>

                        {/* Quantidade */}
                        <td className="p-2 border-r border-slate-900 text-center font-mono">
                          {modoEdicao ? (
                            <input 
                              type="number"
                              step="any"
                              value={item.quantidade}
                              onChange={(e) => handleAlterarItemFd(item.itemSeq || idx + 1, 'quantidade', parseFloat(e.target.value) || 0)}
                              className="w-14 border border-slate-300 px-1 py-0.5 rounded text-center text-xs font-mono"
                            />
                          ) : (
                            item.quantidade
                          )}
                        </td>

                        {/* Preço Unitário */}
                        <td className="p-2 border-r border-slate-900 text-right font-mono">
                          {modoEdicao ? (
                            <input 
                              type="number"
                              step="0.01"
                              value={item.precoUnitario}
                              onChange={(e) => handleAlterarItemFd(item.itemSeq || idx + 1, 'precoUnitario', parseFloat(e.target.value) || 0)}
                              className="w-20 border border-slate-300 px-1 py-0.5 rounded text-right text-xs font-mono"
                            />
                          ) : (
                            fmt(item.precoUnitario)
                          )}
                        </td>

                        {/* Total do Item */}
                        <td className="p-2 text-right font-mono font-bold">
                          {fmt(item.valorTotal)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-400 italic">
                        Nenhum item listado
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 border-t-2 border-slate-900 font-bold text-xs">
                    <td colSpan={4} className="p-2.5 text-right uppercase tracking-wider border-r border-slate-900">
                      TOTAL GERAL:
                    </td>
                    <td className="p-2.5 text-right font-mono font-black text-sm">
                      {fmt(currentDisplay.valorTotalGeral)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

          </div>

        </div>
      ) : (
        /* Estado Vazio */
        <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl p-16 text-center space-y-4 shadow-inner">
          <div className="p-4 bg-slate-900 text-blue-500 rounded-2xl w-16 h-16 mx-auto flex items-center justify-center border border-slate-800">
            <ReceiptText className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-200">
              Nenhum Faturamento Direto Gerado para esta Obra
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
              Você pode gerar pedidos de compra vinculada e faturamento direto com a construtora diretamente a partir de qualquer Quadro Comparativo (QC) aprovado.
            </p>
          </div>
          <button
            onClick={handleAbrirModalNovo}
            className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-600/25"
          >
            <Plus className="w-4 h-4" />
            <span>Gerar Primeiro Faturamento Direto</span>
          </button>
        </div>
      )}

      {/* MODAL DE CRIAÇÃO DE FATURAMENTO DIRETO A PARTIR DE UM QC */}
      {modalNovoAberto && createPortal(
        <div className="fixed inset-0 top-0 left-0 w-screen h-screen z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col p-6 shadow-2xl space-y-5 animate-scaleUp">
            
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600/10 text-blue-400 rounded-2xl border border-blue-500/20">
                  <ReceiptText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    Gerar Faturamento Direto a partir do QC
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Selecione o Quadro Comparativo e o fornecedor para extrair os itens
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalNovoAberto(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
              
              {/* Seleção de QC e Fornecedor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    1. Selecione o Quadro Comparativo (QC)
                  </label>
                  <select
                    value={selectedQcId || ''}
                    onChange={(e) => handleSelecionarQcModal(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {qcsDaObra.map(q => (
                      <option key={q.id} value={q.id}>
                        {q.numeroQuadro} ({q.dataCriacao || 'Salvo'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    2. Selecione o Fornecedor para Faturamento
                  </label>
                  {carregandoComparativo ? (
                    <div className="py-2 text-slate-500 flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />
                      <span>Carregando fornecedores...</span>
                    </div>
                  ) : qcComparativo?.orcamentos && qcComparativo.orcamentos.length > 0 ? (
                    <select
                      value={fornecedorEscolhido}
                      onChange={(e) => setFornecedorEscolhido(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      {qcComparativo.orcamentos.map((o, idx) => (
                        <option key={idx} value={o.nomeFornecedor}>
                          {o.nomeFornecedor} {qcComparativo.fornecedorVencedor === o.nomeFornecedor ? '🏆 (Vencedor)' : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-amber-400 py-2 block">Nenhum orçamento encontrado neste QC</span>
                  )}
                </div>
              </div>

              {/* Definição do Número de Controle (Sequencial vs Manual) */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="block font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                  3. Número de Controle do Faturamento Direto
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setTipoNumeroControle('sequencial')}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      tipoNumeroControle === 'sequencial'
                        ? 'bg-blue-600/10 border-blue-500/50 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">Sequência Automática</span>
                      <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-yellow-400 text-slate-950">
                        CONTROLE {proximoControleSugerido}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Próximo consecutivo da obra</p>
                  </div>

                  <div
                    onClick={() => setTipoNumeroControle('manual')}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      tipoNumeroControle === 'manual'
                        ? 'bg-blue-600/10 border-blue-500/50 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-bold text-slate-200 block">Personalizado</span>
                    <input
                      type="text"
                      disabled={tipoNumeroControle !== 'manual'}
                      value={numeroControleManual}
                      onChange={(e) => setNumeroControleManual(e.target.value.toUpperCase())}
                      placeholder="Ex: 005 ou FD-01"
                      className="mt-1.5 w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono font-bold text-emerald-400 uppercase focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Verificação Inteligente de Dados Complementares */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>Dados Complementares (Serão salvos no banco para os próximos FDs)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Caso algum endereço ou contrato ainda não esteja cadastrado, preencha abaixo para gravar na Obra e no Fornecedor automaticamente:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Endereço Fornecedor:</label>
                    <input
                      type="text"
                      placeholder="Ex: RUA AURIVERDE, 1697 - VL. INDEPENDÊNCIA"
                      value={dadosCompFornecedorEndereco}
                      onChange={(e) => setDadosCompFornecedorEndereco(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">CEP Fornecedor:</label>
                    <input
                      type="text"
                      placeholder="Ex: 02840-160"
                      value={dadosCompFornecedorCep}
                      onChange={(e) => setDadosCompFornecedorCep(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Endereço de Faturamento Obra (Cliente):</label>
                    <input
                      type="text"
                      placeholder="Ex: ALAMEDA DOS JAÚNAS, 70"
                      value={dadosCompClienteEndereco}
                      onChange={(e) => setDadosCompClienteEndereco(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">CEP Faturamento:</label>
                    <input
                      type="text"
                      placeholder="Ex: 04020-060"
                      value={dadosCompClienteCep}
                      onChange={(e) => setDadosCompClienteCep(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Endereço de Entrega (Canteiro):</label>
                    <input
                      type="text"
                      placeholder="Ex: R. MARSELHESA, 535"
                      value={dadosCompEntregaEndereco}
                      onChange={(e) => setDadosCompEntregaEndereco(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Nº do Contrato da Obra:</label>
                    <input
                      type="text"
                      placeholder="Ex: CT-2024/09"
                      value={dadosCompNumeroContrato}
                      onChange={(e) => setDadosCompNumeroContrato(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setModalNovoAberto(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={gerandoFd || !fornecedorEscolhido}
                onClick={handleConfirmarGerarFd}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-600/25 disabled:opacity-50"
              >
                {gerandoFd ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Gerando Documento...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Gerar Faturamento Direto</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {modalExcluirAberto && activeFd && createPortal(
        <div className="fixed inset-0 top-0 left-0 w-screen h-screen z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-base">Excluir Faturamento Direto</h3>
                <p className="text-xs text-slate-400">Ação irreversível</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Tem certeza que deseja excluir o Faturamento Direto <strong className="text-white font-mono">CONTROLE {activeFd.numeroControle}</strong> do fornecedor <strong className="text-white">{activeFd.fornecedorNome}</strong>?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalExcluirAberto(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={excluindo}
                onClick={handleExcluirFd}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-rose-600/25 disabled:opacity-50"
              >
                {excluindo ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
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

      {/* MODAL DE ENVIO DE FATURAMENTO DIRETO POR E-MAIL AO CLIENTE */}
      {modalEmailAberto && currentDisplay && createPortal(
        <div className="fixed inset-0 top-0 left-0 w-screen h-screen z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] p-6 shadow-2xl flex flex-col animate-scaleUp">
            
            {/* Header do Modal */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-600/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
                  <Send className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                    <span>Enviar Faturamento Direto para Construtora</span>
                    <span className="font-mono text-xs bg-yellow-400 text-slate-950 font-black px-2 py-0.5 rounded">
                      FD {currentDisplay.numeroControle}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Solicitação formal de aprovação do pedido de compra vinculada
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setModalEmailAberto(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo com rolagem se necessário */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs pr-1">
              {/* Banner Informativo sobre Engenheiros da Obra */}
              {(() => {
                const obraAtual = currentDisplay.obra || obraInfo;
                const engs = obraAtual?.engenheiros || [];
                const principal = engs.find(e => e.principal) || (engs.length > 0 ? engs[0] : null);
                const outros = engs.filter(e => e !== principal && e.email);

                if (engs.length > 0) {
                  return (
                    <div className="p-3.5 bg-indigo-950/30 border border-indigo-800/40 rounded-2xl space-y-1.5">
                      <div className="flex items-center gap-2 text-indigo-300 font-semibold">
                        <Users className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span>Contatos cadastrados na Obra:</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {principal && (
                          <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg font-bold flex items-center gap-1.5 text-[11px]">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                            <span>Para: {principal.nome || 'Engenheiro Principal'} ({principal.email})</span>
                          </span>
                        )}
                        {outros.map((o, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-lg text-[10px]">
                            Cc: {o.nome || o.email}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Esta obra ainda não possui engenheiros cadastrados na aba <strong>Obras</strong>. Você pode digitar os e-mails manualmente nos campos abaixo.</span>
                  </div>
                );
              })()}

              {/* Campos do E-mail */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Destinatário Principal (Para) *
                    </label>
                    <input
                      type="email"
                      value={emailDestinatario}
                      onChange={(e) => setEmailDestinatario(e.target.value)}
                      placeholder="engenheiro.principal@construtora.com.br"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Em Cópia (CC)
                    </label>
                    <input
                      type="text"
                      value={emailCopia}
                      onChange={(e) => setEmailCopia(e.target.value)}
                      placeholder="eng2@construtora.com, eng3@construtora.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Assunto Padronizado *
                  </label>
                  <input
                    type="text"
                    value={emailAssunto}
                    onChange={(e) => setEmailAssunto(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-semibold focus:outline-none focus:border-indigo-500 text-xs font-sans"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Mensagem / Corpo do E-mail *
                  </label>
                  <textarea
                    rows={6}
                    value={emailCorpo}
                    onChange={(e) => setEmailCorpo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-sans leading-relaxed resize-none"
                    required
                  />
                </div>

                {/* Box de Anexo da Planilha Excel */}
                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 text-slate-300">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-200">Anexo: Planilha Oficial Faturamento Direto (.xlsx)</p>
                      <p className="text-[11px] text-slate-400">Baixe o arquivo para anexar ao seu e-mail antes de enviar.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadExcel}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shrink-0 shadow-sm"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>Baixar Planilha FD</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Rodapé com Ações de Envio */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={handleCopiarTextoEmail}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition border border-slate-700 w-full sm:w-auto justify-center"
              >
                {emailCopiado ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Mensagem Copiada!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Texto</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleAbrirGmail}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
                  title="Abrir diretamente na interface web do Gmail"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir no Gmail</span>
                </button>

                <button
                  type="button"
                  onClick={handleEnviarViaMailto}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/25 active:scale-95"
                  title="Abrir no aplicativo padrão de e-mail (Outlook, Windows Mail, Thunderbird)"
                >
                  <Send className="w-4 h-4" />
                  <span>Abrir no E-mail</span>
                </button>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

export default FaturamentoDiretoView;
