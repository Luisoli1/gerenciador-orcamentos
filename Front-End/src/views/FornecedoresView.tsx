import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../services/api';
import type { Fornecedor } from '../types';
import { 
  Users, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin, 
  Check, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Building2, 
  UserCheck, 
  MessageSquare,
  ExternalLink,
  ShieldAlert,
  Send
} from 'lucide-react';

export function FornecedoresView() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [busca, setBusca] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal de Criação / Edição
  const [modalAberto, setModalAberto] = useState<boolean>(false);
  const [fornecedorEditando, setFornecedorEditando] = useState<Fornecedor | null>(null);
  const [formNome, setFormNome] = useState('');
  const [formCnpj, setFormCnpj] = useState('');
  const [formNomeContato, setFormNomeContato] = useState('');
  const [formEmailContato, setFormEmailContato] = useState('');
  const [formTelefoneContato, setFormTelefoneContato] = useState('');
  const [formCelularContato, setFormCelularContato] = useState('');
  const [formLocalCidade, setFormLocalCidade] = useState('');
  const [formErroValidacao, setFormErroValidacao] = useState<string | null>(null);
  const [salvando, setSalvando] = useState<boolean>(false);

  // Modal de Exclusão
  const [modalExcluirAberto, setModalExcluirAberto] = useState<boolean>(false);
  const [fornecedorParaExcluir, setFornecedorParaExcluir] = useState<Fornecedor | null>(null);
  const [excluindo, setExcluindo] = useState<boolean>(false);

  // Carregar lista de fornecedores
  const carregarFornecedores = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listarFornecedores();
      setFornecedores(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Erro ao carregar fornecedores:", err);
      setError("Não foi possível carregar a lista de fornecedores do servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarFornecedores();
  }, []);

  // Limpar mensagens automáticas após 5 segundos
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 7000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Função para formatar CNPJ dinamicamente
  const formatarCnpjInput = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 14);
    if (raw.length <= 2) return raw;
    if (raw.length <= 5) return `${raw.slice(0, 2)}.${raw.slice(2)}`;
    if (raw.length <= 8) return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5)}`;
    if (raw.length <= 12) return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8)}`;
    return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8, 12)}-${raw.slice(12, 14)}`;
  };

  // Abrir modal de criação
  const handleNovoFornecedor = () => {
    setFornecedorEditando(null);
    setFormNome('');
    setFormCnpj('');
    setFormNomeContato('');
    setFormEmailContato('');
    setFormTelefoneContato('');
    setFormCelularContato('');
    setFormLocalCidade('');
    setFormErroValidacao(null);
    setModalAberto(true);
  };

  // Abrir modal de edição
  const handleEditarFornecedor = (f: Fornecedor) => {
    setFornecedorEditando(f);
    setFormNome(f.nome || '');
    setFormCnpj(f.cnpj ? formatarCnpjInput(f.cnpj) : '');
    setFormNomeContato(f.nomeContato || '');
    setFormEmailContato(f.emailContato || '');
    setFormTelefoneContato(f.telefoneContato || '');
    setFormCelularContato(f.celularContato || '');
    setFormLocalCidade(f.localCidade || '');
    setFormErroValidacao(null);
    setModalAberto(true);
  };

  // Submeter formulário (Criar / Atualizar) com validação estrita de duplicidade
  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErroValidacao(null);

    const nomeTrim = formNome.trim();
    if (!nomeTrim) {
      setFormErroValidacao('Informe a Razão Social ou Nome do fornecedor.');
      return;
    }

    const cnpjLimpo = formCnpj.replace(/\D/g, '');

    // Validação local de duplicidade antes de enviar
    if (!fornecedorEditando) {
      // 1. Validar CNPJ duplicado na criação
      if (cnpjLimpo.length > 0) {
        const existeCnpj = fornecedores.find(
          f => f.cnpj && f.cnpj.replace(/\D/g, '') === cnpjLimpo
        );
        if (existeCnpj) {
          setFormErroValidacao(`Já existe um fornecedor cadastrado com este CNPJ: "${existeCnpj.nome}".`);
          return;
        }
      }

      // 2. Validar Nome/Razão Social duplicado na criação
      const existeNome = fornecedores.find(
        f => f.nome && f.nome.trim().toLowerCase() === nomeTrim.toLowerCase()
      );
      if (existeNome) {
        setFormErroValidacao(`Já existe um fornecedor cadastrado com a Razão Social/Nome "${nomeTrim}".`);
        return;
      }
    } else {
      // Na edição, verifica se não está colidindo com outro fornecedor diferente
      if (cnpjLimpo.length > 0) {
        const existeCnpj = fornecedores.find(
          f => f.id !== fornecedorEditando.id && f.cnpj && f.cnpj.replace(/\D/g, '') === cnpjLimpo
        );
        if (existeCnpj) {
          setFormErroValidacao(`Este CNPJ já está sendo utilizado pelo fornecedor "${existeCnpj.nome}".`);
          return;
        }
      }

      const existeNome = fornecedores.find(
        f => f.id !== fornecedorEditando.id && f.nome && f.nome.trim().toLowerCase() === nomeTrim.toLowerCase()
      );
      if (existeNome) {
        setFormErroValidacao(`Já existe outro fornecedor com o nome "${nomeTrim}".`);
        return;
      }
    }

    const payload: Fornecedor = {
      nome: nomeTrim,
      cnpj: formCnpj.trim() || undefined,
      nomeContato: formNomeContato.trim() || undefined,
      emailContato: formEmailContato.trim() || undefined,
      telefoneContato: formTelefoneContato.trim() || undefined,
      celularContato: formCelularContato.trim() || undefined,
      localCidade: formLocalCidade.trim() || undefined,
    };

    setSalvando(true);
    try {
      if (fornecedorEditando && fornecedorEditando.id) {
        const atualizado = await api.atualizarFornecedor(fornecedorEditando.id, payload);
        setFornecedores(prev => prev.map(f => f.id === fornecedorEditando.id ? atualizado : f));
        setSuccess(`Fornecedor "${atualizado.nome}" atualizado com sucesso!`);
      } else {
        const criado = await api.criarFornecedor(payload);
        setFornecedores(prev => [criado, ...prev]);
        setSuccess(`Fornecedor "${criado.nome}" cadastrado com sucesso!`);
      }
      setModalAberto(false);
    } catch (err: any) {
      console.error("Erro ao salvar fornecedor:", err);
      const msgErro = err?.response?.data?.message || err?.response?.data?.error || "Erro ao salvar fornecedor no servidor.";
      setFormErroValidacao(msgErro);
    } finally {
      setSalvando(false);
    }
  };

  // Abrir confirmação de exclusão
  const handleConfirmarExcluir = (f: Fornecedor) => {
    setFornecedorParaExcluir(f);
    setModalExcluirAberto(true);
  };

  // Executar exclusão
  const handleExcluir = async () => {
    if (!fornecedorParaExcluir || !fornecedorParaExcluir.id) return;
    setExcluindo(true);
    try {
      await api.deletarFornecedor(fornecedorParaExcluir.id);
      setFornecedores(prev => prev.filter(f => f.id !== fornecedorParaExcluir.id));
      setSuccess(`Fornecedor "${fornecedorParaExcluir.nome}" excluído com sucesso.`);
      setModalExcluirAberto(false);
      setFornecedorParaExcluir(null);
    } catch (err: any) {
      console.error("Erro ao excluir fornecedor:", err);
      setError("Erro ao excluir fornecedor. Ele pode estar vinculado a orçamentos existentes no banco de dados.");
    } finally {
      setExcluindo(false);
    }
  };

  // Filtragem em tempo real
  const fornecedoresFiltrados = useMemo(() => {
    if (!busca.trim()) return fornecedores;
    const t = busca.toLowerCase();
    return fornecedores.filter(f => 
      (f.nome && f.nome.toLowerCase().includes(t)) ||
      (f.cnpj && f.cnpj.toLowerCase().includes(t)) ||
      (f.nomeContato && f.nomeContato.toLowerCase().includes(t)) ||
      (f.emailContato && f.emailContato.toLowerCase().includes(t)) ||
      (f.localCidade && f.localCidade.toLowerCase().includes(t)) ||
      (f.telefoneContato && f.telefoneContato.toLowerCase().includes(t)) ||
      (f.celularContato && f.celularContato.toLowerCase().includes(t))
    );
  }, [fornecedores, busca]);

  // Estatísticas rápidas
  const totalComContato = useMemo(() => {
    return fornecedores.filter(f => f.nomeContato || f.emailContato || f.celularContato || f.telefoneContato).length;
  }, [fornecedores]);

  const cidadesUnicas = useMemo(() => {
    const cidades = fornecedores.map(f => f.localCidade?.trim()).filter(Boolean);
    return new Set(cidades).size;
  }, [fornecedores]);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Alertas Flutuantes de Sucesso / Erro */}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl flex items-center justify-between shadow-lg shadow-emerald-500/5 animate-fade-in">
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
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl flex items-center justify-between shadow-lg shadow-rose-500/5 animate-fade-in">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Cabeçalho Principal */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-blue-600/10 text-blue-400 rounded-2xl border border-blue-500/20 shadow-inner">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
              Gestão de Fornecedores & Parceiros
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Cadastre, atualize e consulte fornecedores homologados para cotações e orçamentos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={carregarFornecedores}
            disabled={loading}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-all hover:text-white disabled:opacity-50"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleNovoFornecedor}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-xs transition-all shadow-lg shadow-blue-600/25 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Fornecedor</span>
          </button>
        </div>
      </div>

      {/* Cards de Métricas / Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Total Cadastrados</span>
            <span className="text-2xl font-black text-slate-100">{fornecedores.length}</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Com Contato Comercial</span>
            <span className="text-2xl font-black text-emerald-400">{totalComContato}</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Cidades Atendidas</span>
            <span className="text-2xl font-black text-purple-400">{cidadesUnicas}</span>
          </div>
        </div>
      </div>

      {/* Barra de Busca e Filtro */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar fornecedor por Razão Social, CNPJ, Contato, Cidade ou E-mail..."
          className="w-full pl-11 pr-4 py-3 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
        />
        {busca && (
          <button 
            onClick={() => setBusca('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Lista de Fornecedores */}
      {loading ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Carregando fornecedores cadastrados...</p>
        </div>
      ) : fornecedoresFiltrados.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center space-y-3">
          <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">
            {busca ? "Nenhum fornecedor encontrado para os termos pesquisados." : "Nenhum fornecedor cadastrado até o momento."}
          </p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {busca ? "Tente alterar os filtros ou limpar a pesquisa." : "Cadastre o primeiro fornecedor parceiro clicando no botão acima."}
          </p>
          {!busca && (
            <button
              onClick={handleNovoFornecedor}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Fornecedor</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fornecedoresFiltrados.map((fornecedor) => (
            <div 
              key={fornecedor.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between shadow-md hover:shadow-xl group"
            >
              <div className="space-y-3">
                {/* Nome e Ações */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20 shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-1">
                        {fornecedor.nome}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {fornecedor.cnpj ? fornecedor.cnpj : 'CNPJ não informado'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditarFornecedor(fornecedor)}
                      className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-blue-400 rounded-lg transition-colors"
                      title="Editar Fornecedor"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleConfirmarExcluir(fornecedor)}
                      className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                      title="Excluir Fornecedor"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Localidade e Contato */}
                <div className="pt-2 border-t border-slate-800/80 space-y-2 text-xs">
                  {fornecedor.localCidade && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{fornecedor.localCidade}</span>
                    </div>
                  )}

                  {fornecedor.nomeContato && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="font-medium truncate">{fornecedor.nomeContato}</span>
                    </div>
                  )}

                  {fornecedor.emailContato && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <a 
                        href={`mailto:${fornecedor.emailContato}`}
                        className="text-blue-400 hover:underline truncate"
                        title={fornecedor.emailContato}
                      >
                        {fornecedor.emailContato}
                      </a>
                    </div>
                  )}

                  {(fornecedor.celularContato || fornecedor.telefoneContato) && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <div className="flex items-center gap-2 flex-wrap">
                        {fornecedor.celularContato && (
                          <a 
                            href={`https://wa.me/55${fornecedor.celularContato.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:underline font-mono text-[11px] inline-flex items-center gap-1"
                            title="Conversar no WhatsApp"
                          >
                            <MessageSquare className="w-3 h-3" />
                            {fornecedor.celularContato}
                          </a>
                        )}
                        {fornecedor.telefoneContato && (
                          <span className="text-slate-400 font-mono text-[11px]">
                            {fornecedor.telefoneContato}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-2.5 border-t border-slate-800/50 flex items-center justify-between text-[11px] text-slate-500">
                <span>ID: #{fornecedor.id}</span>
                <span className="text-emerald-500/80 font-medium">Homologado</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Criação / Edição */}
      {modalAberto && createPortal(
        <div className="fixed inset-0 top-0 left-0 w-screen h-screen z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600/10 text-blue-400 rounded-xl border border-blue-500/20">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-100">
                    {fornecedorEditando ? 'Atualizar Fornecedor' : 'Cadastrar Novo Fornecedor'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {fornecedorEditando ? 'Modifique os dados cadastrais do fornecedor' : 'Informe os dados para homologação no sistema'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setModalAberto(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="p-6 space-y-4">
              {formErroValidacao && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <strong className="block font-semibold">Validação Cadastral:</strong>
                    <span>{formErroValidacao}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Razão Social / Nome <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Elecon Indústria e Comércio Ltda."
                  value={formNome}
                  onChange={(e) => {
                    setFormNome(e.target.value);
                    if (formErroValidacao) setFormErroValidacao(null);
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    placeholder="00.000.000/0000-00"
                    value={formCnpj}
                    onChange={(e) => {
                      setFormCnpj(formatarCnpjInput(e.target.value));
                      if (formErroValidacao) setFormErroValidacao(null);
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Cidade / Região
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: São Paulo - SP"
                    value={formLocalCidade}
                    onChange={(e) => setFormLocalCidade(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3">
                <span className="block text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">
                  Contato Comercial / Vendedor
                </span>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nome do Contato / Vendedor
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Lucas Pereira"
                      value={formNomeContato}
                      onChange={(e) => setFormNomeContato(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      E-mail Comercial
                    </label>
                    <input
                      type="email"
                      placeholder="vendas@fornecedor.com.br"
                      value={formEmailContato}
                      onChange={(e) => setFormEmailContato(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Celular / WhatsApp
                      </label>
                      <input
                        type="text"
                        placeholder="(11) 99999-9999"
                        value={formCelularContato}
                        onChange={(e) => setFormCelularContato(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Telefone Fixo
                      </label>
                      <input
                        type="text"
                        placeholder="(11) 3333-3333"
                        value={formTelefoneContato}
                        onChange={(e) => setFormTelefoneContato(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-blue-600/25 disabled:opacity-50"
                >
                  {salvando ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{fornecedorEditando ? 'Atualizar Fornecedor' : 'Cadastrar Fornecedor'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Exclusão */}
      {modalExcluirAberto && fornecedorParaExcluir && createPortal(
        <div className="fixed inset-0 top-0 left-0 w-screen h-screen z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-in space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-base">Excluir Fornecedor</h3>
                <p className="text-xs text-slate-400">Ação permanente</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Tem certeza que deseja excluir o fornecedor <strong className="text-white font-semibold">{fornecedorParaExcluir.nome}</strong>?
            </p>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300">
              Atenção: Se este fornecedor possuir orçamentos ou cotações arquivadas, a exclusão poderá ser impedida pelo banco de dados para integridade dos dados.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setModalExcluirAberto(false);
                  setFornecedorParaExcluir(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={excluindo}
                onClick={handleExcluir}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-rose-600/25 disabled:opacity-50"
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
    </div>
  );
}

export default FornecedoresView;
