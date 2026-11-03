import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../services/api';
import type { Obra, ViewKey, Qc, OrcamentoSalvo, EngenheiroObra } from '../types';
import { 
  Building2, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Briefcase, 
  ArrowRight,
  RefreshCw,
  Scale,
  FileSpreadsheet,
  TrendingUp,
  Sparkles,
  Calendar,
  Tag,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Eye,
  MapPin,
  Mail,
  Users,
  Star,
  FileText
} from 'lucide-react';

interface ObrasViewProps {
  activeObraId: number;
  onSelectObra: (id: number) => void;
  onNavigate: (view: ViewKey, obraId?: number) => void;
  onSelectQc?: (qcId: number, obraId: number) => void;
  onObrasChanged?: () => void;
}

export function ObrasView({ activeObraId, onSelectObra, onNavigate, onSelectQc, onObrasChanged }: ObrasViewProps) {
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal de criação / edição
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nomeObra, setNomeObra] = useState('');
  const [nomeCliente, setNomeCliente] = useState('');
  const [cnpjCliente, setCnpjCliente] = useState('');
  const [enderecoObra, setEnderecoObra] = useState('');
  const [cepObra, setCepObra] = useState('');
  const [numeroContrato, setNumeroContrato] = useState('');
  const [engenheiros, setEngenheiros] = useState<EngenheiroObra[]>([]);

  // Hub / Central Interativa da Obra Selecionada
  const [selectedHubObra, setSelectedHubObra] = useState<Obra | null>(null);
  const [hubTab, setHubTab] = useState<'qcs' | 'orcamentos' | 'variacao'>('qcs');
  const [obraQcs, setObraQcs] = useState<Qc[]>([]);
  const [obraOrcamentos, setObraOrcamentos] = useState<OrcamentoSalvo[]>([]);
  const [loadingHubData, setLoadingHubData] = useState<boolean>(false);
  const [expandedOrcamentoId, setExpandedOrcamentoId] = useState<number | null>(null);

  const carregarObras = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listarObras();
      setObras(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Erro ao carregar obras:", err);
      setError("Não foi possível carregar as obras do servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarObras();
  }, []);

  // Quando uma obra for selecionada no Hub, carregar seus QCs e seus Orçamentos reais do banco
  useEffect(() => {
    if (selectedHubObra?.id) {
      setLoadingHubData(true);
      Promise.all([
        api.listarQcsPorObra(selectedHubObra.id).catch(() => []),
        api.listarOrcamentosPorObra(selectedHubObra.id).catch(() => [])
      ]).then(([qcs, orcs]) => {
        setObraQcs(Array.isArray(qcs) ? qcs : []);
        setObraOrcamentos(Array.isArray(orcs) ? orcs : []);
      }).finally(() => {
        setLoadingHubData(false);
      });
    }
  }, [selectedHubObra]);

  const abrirModalCriacao = () => {
    setEditingId(null);
    setNomeObra('');
    setNomeCliente('');
    setCnpjCliente('');
    setEnderecoObra('');
    setCepObra('');
    setNumeroContrato('');
    setEngenheiros([{ nome: '', email: '', principal: true }]);
    setShowModal(true);
  };

  const abrirModalEdicao = (obra: Obra, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingId(obra.id || null);
    setNomeObra(obra.nomeObra || '');
    setNomeCliente(obra.nomeCliente || '');
    setCnpjCliente(obra.cnpjCliente || '');
    setEnderecoObra(obra.enderecoObra || '');
    setCepObra(obra.cepObra || '');
    setNumeroContrato(obra.numeroContrato || '');
    const engs = (obra.engenheiros && obra.engenheiros.length > 0)
      ? obra.engenheiros.map(en => ({ ...en }))
      : [{ nome: '', email: '', principal: true }];
    setEngenheiros(engs);
    setShowModal(true);
  };

  const adicionarEngenheiro = () => {
    setEngenheiros(prev => [
      ...prev,
      { nome: '', email: '', principal: prev.length === 0 }
    ]);
  };

  const removerEngenheiro = (index: number) => {
    setEngenheiros(prev => {
      const novaLista = prev.filter((_, i) => i !== index);
      if (novaLista.length > 0 && !novaLista.some(e => e.principal)) {
        novaLista[0].principal = true;
      }
      return novaLista;
    });
  };

  const definirPrincipal = (index: number) => {
    setEngenheiros(prev => prev.map((eng, i) => ({
      ...eng,
      principal: i === index
    })));
  };

  const atualizarEngenheiro = (index: number, campo: 'nome' | 'email', valor: string) => {
    setEngenheiros(prev => prev.map((eng, i) => {
      if (i === index) {
        return { ...eng, [campo]: valor };
      }
      return eng;
    }));
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeObra.trim() || !nomeCliente.trim()) {
      setError("Preencha ao menos o nome da obra e o nome do cliente.");
      return;
    }

    const engsValidos = engenheiros
      .filter(e => e.nome.trim() || e.email.trim())
      .map(e => ({
        ...e,
        nome: e.nome.trim(),
        email: e.email.trim()
      }));

    if (engsValidos.length > 0 && !engsValidos.some(e => e.principal)) {
      engsValidos[0].principal = true;
    }

    const payload: Obra = {
      id: editingId || undefined,
      nomeObra: nomeObra.trim(),
      nomeCliente: nomeCliente.trim(),
      cnpjCliente: cnpjCliente.trim(),
      enderecoObra: enderecoObra.trim(),
      cepObra: cepObra.trim(),
      numeroContrato: numeroContrato.trim(),
      engenheiros: engsValidos
    };

    try {
      if (editingId) {
        await api.atualizarObra(editingId, payload);
        setSuccess("Obra atualizada com sucesso!");
      } else {
        await api.criarObra(payload);
        setSuccess("Nova obra cadastrada com sucesso!");
      }
      setShowModal(false);
      await carregarObras();
      if (onObrasChanged) onObrasChanged();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error("Erro ao salvar obra:", err);
      setError(err?.response?.data || "Erro ao salvar obra no servidor.");
    }
  };

  const handleDeletar = async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Tem certeza que deseja excluir a obra #${id}?`)) return;
    try {
      await api.deletarObra(id);
      setSuccess(`Obra #${id} excluída com sucesso!`);
      if (selectedHubObra?.id === id) setSelectedHubObra(null);
      await carregarObras();
      if (onObrasChanged) onObrasChanged();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error("Erro ao deletar obra:", err);
      setError("Não foi possível excluir a obra.");
    }
  };

  const abrirHubObra = (obra: Obra) => {
    setSelectedHubObra(obra);
    setHubTab('qcs');
  };

  const fmt = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '-';
    return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="p-6 space-y-6 text-slate-100 font-sans">
      
      {/* CABEÇALHO DA ABA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              Histórico e Gestão de Obras
            </h2>
            <p className="text-xs text-slate-400">
              Clique em qualquer obra para consultar seus QCs, Orçamentos e montar o comparativo na tela
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button 
            onClick={carregarObras}
            disabled={loading}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition text-xs flex items-center gap-1.5 cursor-pointer"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button 
            onClick={abrirModalCriacao}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Obra</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK MENSAGENS */}
      {success && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* LISTA DE OBRAS CADASTRADAS */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
          <p className="text-xs">Carregando histórico de obras...</p>
        </div>
      ) : obras.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800 space-y-3">
          <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">Nenhuma obra cadastrada ainda</h3>
          <p className="text-xs text-slate-500">Clique em "Nova Obra" para cadastrar sua primeira construção civil.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {obras.map((obra) => {
            const isAtiva = obra.id === activeObraId;

            return (
              <div
                key={obra.id}
                onClick={() => abrirHubObra(obra)}
                className={`group bg-slate-900/80 hover:bg-slate-900 border rounded-2xl p-5 space-y-4 cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 ${
                  isAtiva 
                    ? 'border-blue-500/80 ring-1 ring-blue-500/30' 
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Cabeçalho do Card */}
                <div className="flex justify-between items-start gap-2">
                  <div className="p-2.5 bg-slate-800/80 group-hover:bg-blue-600/20 text-slate-300 group-hover:text-blue-400 rounded-xl transition">
                    <Building2 className="w-5 h-5" />
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isAtiva ? (
                      <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-[10px] font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> ATIVA
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 group-hover:text-blue-400 transition flex items-center gap-1">
                        <span>Acessar Obra</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Informações da Obra */}
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-slate-100 group-hover:text-blue-300 transition truncate">
                    {obra.nomeObra}
                  </h3>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">Cliente: {obra.nomeCliente || "Não informado"}</span>
                  </div>
                  {obra.cnpjCliente && (
                    <p className="text-[11px] font-mono text-slate-500">
                      CNPJ: {obra.cnpjCliente}
                    </p>
                  )}
                  {obra.enderecoObra && (
                    <div className="text-xs text-slate-400 flex items-start gap-1.5 pt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="truncate text-[11px]">{obra.enderecoObra}{obra.cepObra ? ` • CEP ${obra.cepObra}` : ''}</span>
                    </div>
                  )}
                  {obra.engenheiros && obra.engenheiros.length > 0 && (
                    <div className="pt-1.5 border-t border-slate-800/60">
                      {(() => {
                        const princ = obra.engenheiros.find(e => e.principal) || obra.engenheiros[0];
                        const outros = obra.engenheiros.length - 1;
                        return (
                          <div className="flex items-center justify-between text-[11px] text-slate-300">
                            <div className="flex items-center gap-1.5 truncate">
                              <Users className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                              <span className="truncate">
                                <strong>{princ.nome || 'Engenheiro'}</strong>
                                {princ.email ? <span className="text-slate-400"> ({princ.email})</span> : ''}
                              </span>
                            </div>
                            {outros > 0 && (
                              <span className="shrink-0 px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px] font-medium ml-1">
                                +{outros} cc
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Ações Rápidas no Card */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-xs font-semibold text-blue-400 group-hover:underline flex items-center gap-1">
                    <span>Consultar QCs & Orçamentos</span>
                    <Sparkles className="w-3 h-3" />
                  </span>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => abrirModalEdicao(obra, e)}
                      className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                      title="Editar Obra"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => obra.id && handleDeletar(obra.id, e)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition cursor-pointer"
                      title="Excluir Obra"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CENTRAL DA OBRA (MODAL INTELIGENTE DE CONSULTA DE QCS E ORÇAMENTOS) */}
      {selectedHubObra && createPortal(
        <div className="fixed inset-0 top-0 left-0 w-screen h-screen z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl p-6 shadow-2xl space-y-6 max-h-[90vh] flex flex-col animate-scaleUp">
            
            {/* Header do Hub */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600/10 text-blue-400 rounded-2xl border border-blue-500/20">
                  <Building2 className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-blue-400 px-2 py-0.5 bg-blue-950 rounded">
                      Obra #{selectedHubObra.id}
                    </span>
                    <span className="text-xs text-slate-400">
                      Cliente: <strong className="text-slate-200">{selectedHubObra.nomeCliente}</strong>
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-100 mt-1">
                    {selectedHubObra.nomeObra}
                  </h3>
                  <div className="flex items-center gap-3 flex-wrap mt-1 text-xs text-slate-400">
                    {selectedHubObra.cnpjCliente && (
                      <span className="font-mono">CNPJ: {selectedHubObra.cnpjCliente}</span>
                    )}
                    {selectedHubObra.numeroContrato && (
                      <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono">
                        Contrato: {selectedHubObra.numeroContrato}
                      </span>
                    )}
                    {selectedHubObra.enderecoObra && (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{selectedHubObra.enderecoObra}{selectedHubObra.cepObra ? ` • CEP ${selectedHubObra.cepObra}` : ''}</span>
                      </span>
                    )}
                  </div>
                  {selectedHubObra.engenheiros && selectedHubObra.engenheiros.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap mt-2">
                      <span className="text-[11px] font-semibold text-slate-400">Engenheiros:</span>
                      {selectedHubObra.engenheiros.map((eng, idx) => (
                        <span 
                          key={idx}
                          className={`text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            eng.principal 
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold' 
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {eng.principal && <Star className="w-3 h-3 fill-amber-400 text-amber-400" />}
                          <span>{eng.nome || 'Sem nome'}{eng.email ? ` (${eng.email})` : ''}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button 
                onClick={() => setSelectedHubObra(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ABAS DO HUB */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 shrink-0">
              <button
                onClick={() => setHubTab('qcs')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                  hubTab === 'qcs' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                <Scale className="w-4 h-4" />
                <span>Quadros Comparativos (QCs) ({obraQcs.length})</span>
              </button>

              <button
                onClick={() => setHubTab('orcamentos')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                  hubTab === 'orcamentos' 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Orçamentos Salvos no Banco ({obraOrcamentos.length})</span>
              </button>

              <button
                onClick={() => setHubTab('variacao')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                  hubTab === 'variacao' 
                    ? 'bg-rose-600 text-white shadow-md' 
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Auditoria & Variação de Preços</span>
              </button>
            </div>

            {/* CONTEÚDO DINÂMICO DAS ABAS */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              
              {loadingHubData ? (
                <div className="p-12 text-center text-slate-500">
                  <RefreshCw className="w-7 h-7 animate-spin mx-auto text-blue-500 mb-2" />
                  <p className="text-xs">Consultando banco de dados da obra...</p>
                </div>
              ) : hubTab === 'qcs' ? (
                
                /* ABA 1: CONSULTAR QCS DA OBRA E MONTAR NA TELA */
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-slate-400">
                      Selecione um QC abaixo para carregá-lo <strong>montado na tela</strong>:
                    </p>

                    <button
                      onClick={() => {
                        if (selectedHubObra.id) onNavigate('qc', selectedHubObra.id);
                        setSelectedHubObra(null);
                      }}
                      className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Novo QC (+ Importar PDFs)</span>
                    </button>
                  </div>

                  {obraQcs.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800/80 space-y-2">
                      <Scale className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-xs font-semibold text-slate-300">Nenhum Quadro Comparativo salvo para esta obra</p>
                      <p className="text-[11px] text-slate-500">Clique em "Novo QC" para importar os primeiros PDFs e gerar a concorrência.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {obraQcs.map((qc) => (
                        <div
                          key={qc.id}
                          className="bg-slate-950/70 border border-slate-800 hover:border-blue-500/70 rounded-2xl p-4 space-y-3 transition shadow-md flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-mono font-black">
                                {qc.numeroQuadro}
                              </span>
                              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-500" />
                                <span>{qc.dataCriacao || 'Data N/D'}</span>
                              </span>
                            </div>

                            <h4 className="text-sm font-bold text-slate-100 mt-2">
                              Quadro Concorrência {qc.numeroQuadro}
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Obra: {selectedHubObra.nomeObra}
                            </p>
                          </div>

                          {/* BOTÃO PARA MONTAR O QC NA TELA */}
                          <button
                            onClick={() => {
                              if (onSelectQc && selectedHubObra.id) {
                                onSelectQc(qc.id, selectedHubObra.id);
                              } else if (selectedHubObra.id) {
                                onNavigate('qc', selectedHubObra.id);
                              }
                              setSelectedHubObra(null);
                            }}
                            className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-md shadow-blue-600/20 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Visualizar {qc.numeroQuadro} na Tela</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              ) : hubTab === 'orcamentos' ? (
                
                /* ABA 2: CONSULTAR ORÇAMENTOS DO BANCO DAQUELA OBRA */
                <div className="space-y-4">
                  <p className="text-xs text-slate-400">
                    Propostas comerciais e cotações de fornecedores salvas no banco de dados para esta obra:
                  </p>

                  {obraOrcamentos.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800/80 space-y-2">
                      <FileSpreadsheet className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-xs font-semibold text-slate-300">Nenhum orçamento salvo no banco para esta obra</p>
                      <p className="text-[11px] text-slate-500">Ao processar PDFs no módulo QC, eles são registrados automaticamente aqui.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {obraOrcamentos.map((orc) => {
                        const isExpanded = expandedOrcamentoId === orc.id;
                        const qtdItens = orc.itens?.length || 0;

                        return (
                          <div
                            key={orc.id}
                            className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <span className="text-xs font-black text-slate-100 block">
                                  {orc.fornecedor?.nome || "Fornecedor"}
                                </span>
                                <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                                  <span className="flex items-center gap-1 font-mono text-blue-400">
                                    <Tag className="w-3 h-3" />
                                    <span>Orç: <strong>{orc.numeroOrcamento}</strong></span>
                                  </span>
                                  {orc.dataEmissao && (
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3 text-slate-500" />
                                      <span>Emissão: {orc.dataEmissao}</span>
                                    </span>
                                  )}
                                  {orc.fornecedor?.nomeContato && (
                                    <span className="flex items-center gap-1 text-slate-300">
                                      <UserCheck className="w-3 h-3 text-emerald-400" />
                                      <span>{orc.fornecedor.nomeContato}</span>
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Valor Total</span>
                                  <span className="text-sm font-mono font-black text-emerald-400">
                                    {fmt(orc.valorTotal || orc.valorTotalMercadoria)}
                                  </span>
                                </div>

                                {qtdItens > 0 && (
                                  <button
                                    onClick={() => setExpandedOrcamentoId(isExpanded ? null : orc.id)}
                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition text-xs flex items-center gap-1 cursor-pointer"
                                    title="Ver itens da cotação"
                                  >
                                    <span className="text-[11px] font-semibold">{qtdItens} itens</span>
                                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* LISTA EXPANDÍVEL DE ITENS DO ORÇAMENTO */}
                            {isExpanded && orc.itens && (
                              <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                                  Itens Contidos nesta Proposta:
                                </span>
                                <div className="max-h-48 overflow-y-auto divide-y divide-slate-800/60 text-xs">
                                  {orc.itens.map((it, idx) => (
                                    <div key={idx} className="py-1.5 flex justify-between items-center text-[11px]">
                                      <div className="truncate max-w-xs text-slate-300">
                                        <span className="font-mono text-slate-500 mr-2">#{idx + 1}</span>
                                        <span>{it.descricao}</span>
                                      </div>
                                      <div className="flex items-center gap-4 text-right shrink-0 font-mono">
                                        <span className="text-slate-400">{it.quantidade || 1} {it.unidadeDeMedida || 'PÇ'}</span>
                                        <span className="text-slate-200">{fmt(it.valorUnitario)}/un</span>
                                        <span className="text-emerald-400 font-bold">{fmt(it.valorTotal)}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              ) : (
                
                /* ABA 3: AUDITORIA & VARIAÇÃO */
                <div className="p-6 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-4 text-center">
                  <TrendingUp className="w-10 h-10 text-rose-400 mx-auto" />
                  <h4 className="text-base font-bold text-slate-100">
                    Auditoria de Preços & Cotações Passadas
                  </h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Recebeu uma nova proposta de fornecedor para esta obra? Vá até a aba de Variação para cruzar os preços com os orçamentos históricos do banco de dados e gerar argumentos com o nome do vendedor.
                  </p>
                  <button
                    onClick={() => {
                      if (selectedHubObra.id) onNavigate('variation', selectedHubObra.id);
                      setSelectedHubObra(null);
                    }}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-rose-600/20 cursor-pointer inline-flex items-center gap-2"
                  >
                    <span>Ir para Análise de Variação</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              )}

            </div>

            {/* Rodapé do Hub */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs shrink-0">
              <span className="text-slate-500">
                Obra Ativa Atual: #{activeObraId}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (selectedHubObra.id) onSelectObra(selectedHubObra.id);
                    setSelectedHubObra(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold transition cursor-pointer"
                >
                  Definir como Obra Ativa
                </button>
                <button
                  onClick={() => abrirModalEdicao(selectedHubObra)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar Dados</span>
                </button>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* MODAL DE CRIAÇÃO / EDIÇÃO DE OBRA */}
      {showModal && createPortal(
        <div className="fixed inset-0 top-0 left-0 w-screen h-screen z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] p-6 shadow-2xl flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600/10 text-blue-400 rounded-xl">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">
                    {editingId ? `Editar Obra #${editingId}` : "Cadastrar Nova Obra"}
                  </h3>
                  <p className="text-[11px] text-slate-400">Dados da obra, endereço e engenheiros responsáveis</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="flex-1 overflow-y-auto py-4 space-y-5 text-xs pr-1">
              {/* SEÇÃO 1: DADOS GERAIS */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>1. Identificação da Obra</span>
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-slate-400 font-semibold mb-1">
                      Nome da Obra *
                    </label>
                    <input
                      type="text"
                      value={nomeObra}
                      onChange={(e) => setNomeObra(e.target.value)}
                      placeholder="Ex: Galpão Logístico Osasco"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Cliente / Construtora *
                    </label>
                    <input
                      type="text"
                      value={nomeCliente}
                      onChange={(e) => setNomeCliente(e.target.value)}
                      placeholder="Ex: Construtora Makinsthal Ltda"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      CNPJ do Cliente
                    </label>
                    <input
                      type="text"
                      value={cnpjCliente}
                      onChange={(e) => setCnpjCliente(e.target.value)}
                      placeholder="00.000.000/0000-00"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-slate-400 font-semibold mb-1">
                      Número do Contrato (Opcional)
                    </label>
                    <input
                      type="text"
                      value={numeroContrato}
                      onChange={(e) => setNumeroContrato(e.target.value)}
                      placeholder="Ex: CTR-2024/08"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* SEÇÃO 2: ENDEREÇO DA OBRA */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>2. Localização & Endereço da Obra</span>
                </span>
                <p className="text-[11px] text-slate-500">
                  Este endereço será utilizado automaticamente no cabeçalho do Faturamento Direto.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-slate-400 font-semibold mb-1">
                      Endereço Completo
                    </label>
                    <input
                      type="text"
                      value={enderecoObra}
                      onChange={(e) => setEnderecoObra(e.target.value)}
                      placeholder="Ex: Av. dos Autonomistas, 1500 - Centro - Osasco/SP"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      CEP
                    </label>
                    <input
                      type="text"
                      value={cepObra}
                      onChange={(e) => setCepObra(e.target.value)}
                      placeholder="06020-000"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* SEÇÃO 3: ENGENHEIROS DA OBRA */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>3. Engenheiros da Obra (Contatos Construtora)</span>
                  </span>
                  <button
                    type="button"
                    onClick={adicionarEngenheiro}
                    className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-lg text-[11px] font-semibold border border-indigo-500/30 transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Adicionar Engenheiro</span>
                  </button>
                </div>

                <div className="p-3 bg-indigo-950/20 border border-indigo-900/40 rounded-xl text-[11px] text-indigo-300 space-y-1">
                  <p>
                    <strong>Como funciona o envio do Faturamento Direto:</strong>
                  </p>
                  <p className="text-slate-400">
                    O engenheiro marcado como <strong className="text-amber-300">⭐ Principal</strong> receberá a mensagem no campo <strong>Para</strong> do e-mail. Se houver mais de um, os outros irão automaticamente em <strong>Cópia (CC)</strong>.
                  </p>
                </div>

                <div className="space-y-2">
                  {engenheiros.map((eng, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3 rounded-xl border transition flex flex-col sm:flex-row items-start sm:items-center gap-2.5 ${
                        eng.principal 
                          ? 'bg-amber-500/5 border-amber-500/30' 
                          : 'bg-slate-950/60 border-slate-800'
                      }`}
                    >
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                        <input
                          type="text"
                          value={eng.nome}
                          onChange={(e) => atualizarEngenheiro(idx, 'nome', e.target.value)}
                          placeholder="Nome do Engenheiro (ex: Eng. Marcos)"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                        />
                        <input
                          type="email"
                          value={eng.email}
                          onChange={(e) => atualizarEngenheiro(idx, 'email', e.target.value)}
                          placeholder="e-mail (ex: marcos@construtora.com)"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                        />
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => definirPrincipal(idx)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                            eng.principal
                              ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20'
                              : 'bg-slate-800 text-slate-400 hover:text-amber-300 hover:bg-slate-700'
                          }`}
                          title={eng.principal ? "Este é o engenheiro principal (Destinatário Para)" : "Clique para definir como principal"}
                        >
                          <Star className={`w-3.5 h-3.5 ${eng.principal ? 'fill-slate-950' : ''}`} />
                          <span>{eng.principal ? 'Principal' : 'Tornar Principal'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => removerEngenheiro(idx)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition cursor-pointer"
                          title="Remover engenheiro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {engenheiros.length === 0 && (
                    <div className="text-center py-4 text-slate-500 bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-xs">
                      Nenhum engenheiro cadastrado para esta obra. Clique em "+ Adicionar Engenheiro".
                    </div>
                  )}
                </div>
              </div>

              {/* BOTÕES DE AÇÃO */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition shadow-lg shadow-blue-600/20 cursor-pointer"
                >
                  {editingId ? "Salvar Alterações" : "Cadastrar Obra"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

export default ObrasView;
