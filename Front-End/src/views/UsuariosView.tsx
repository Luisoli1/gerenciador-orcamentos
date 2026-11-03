import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import type { Usuario, Role } from '../types';
import api from '../services/api';
import { Users, UserPlus, Shield, User, CheckCircle, XCircle, Trash2, Edit3, X, RefreshCw } from 'lucide-react';

export const UsuariosView: React.FC = () => {
  const { user: usuarioLogado } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);

  // Form states
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [role, setRole] = useState<Role>('OPERADOR');
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);

  const carregarUsuarios = async () => {
    try {
      setCarregando(true);
      const lista = await api.listarUsuarios();
      setUsuarios(lista);
    } catch (err: any) {
      console.error('Erro ao carregar usuários:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const abrirModalCriar = () => {
    setUsuarioEditando(null);
    setNome('');
    setEmail('');
    setSenha('');
    setRole('OPERADOR');
    setErroForm(null);
    setModalAberto(true);
  };

  const abrirModalEditar = (u: Usuario) => {
    setUsuarioEditando(u);
    setNome(u.nome);
    setEmail(u.email);
    setSenha(''); // Deixar vazio se não quiser alterar a senha
    setRole(u.role);
    setErroForm(null);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setUsuarioEditando(null);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSalvando(true);
      setErroForm(null);

      if (usuarioEditando) {
        // Atualizar
        await api.atualizarUsuario(usuarioEditando.id, {
          nome,
          senha: senha || undefined,
          role
        });
      } else {
        // Criar
        if (!senha) {
          setErroForm('Por favor, informe a senha para o novo usuário.');
          setSalvando(false);
          return;
        }
        await api.criarUsuario({ nome, email, senha, role });
      }

      fecharModal();
      carregarUsuarios();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erro ao salvar usuário.';
      setErroForm(msg);
    } finally {
      setSalvando(false);
    }
  };

  const handleAlternarStatus = async (u: Usuario) => {
    if (u.id === usuarioLogado?.id) {
      alert('Você não pode desativar a sua própria conta logada.');
      return;
    }
    const acao = u.ativo ? 'desativar' : 'ativar';
    if (!window.confirm(`Deseja realmente ${acao} o acesso de ${u.nome}?`)) return;

    try {
      await api.alternarStatusUsuario(u.id);
      carregarUsuarios();
    } catch (err: any) {
      alert('Erro ao alterar status do usuário.');
    }
  };

  const handleExcluir = async (u: Usuario) => {
    if (u.id === usuarioLogado?.id) {
      alert('Você não pode excluir a sua própria conta.');
      return;
    }
    if (!window.confirm(`ATENÇÃO: Deseja realmente excluir permanentemente o usuário ${u.nome} (${u.email})?`)) return;

    try {
      await api.deletarUsuario(u.id);
      carregarUsuarios();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erro ao excluir usuário.';
      alert(msg);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-sm backdrop-blur">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Gestão de Usuários da Equipe
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Acesso Exclusivo do Dono
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gerencie quem tem acesso ao sistema de orçamentos, crie novas contas e controle permissões.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={carregarUsuarios}
            className="p-2.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={abrirModalCriar}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98]"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar Usuário</span>
          </button>
        </div>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl backdrop-blur">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Usuário</th>
                <th className="py-3.5 px-4">E-mail</th>
                <th className="py-3.5 px-4">Perfil</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Data de Criação</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {carregando ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="inline-block w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-2" />
                    <p>Carregando usuários...</p>
                  </td>
                </tr>
              ) : usuarios.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Nenhum usuário cadastrado.
                  </td>
                </tr>
              ) : (
                usuarios.map((u) => {
                  const isEu = u.id === usuarioLogado?.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-amber-400">
                          {u.nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span>{u.nome}</span>
                          {isEu && (
                            <span className="ml-2 text-[10px] text-amber-400 font-normal italic">
                              (Você)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{u.email}</td>
                      <td className="py-3.5 px-4">
                        {u.role === 'DONO' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <Shield className="w-3 h-3" />
                            DONO (ADMIN)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                            <User className="w-3 h-3" />
                            OPERADOR
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {u.ativo ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-400 font-medium">
                            <XCircle className="w-3.5 h-3.5" />
                            Desativado
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {new Date(u.dataCriacao).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleAlternarStatus(u)}
                            disabled={isEu}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                              u.ativo
                                ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 disabled:opacity-40'
                                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-40'
                            }`}
                          >
                            {u.ativo ? 'Desativar' : 'Ativar'}
                          </button>
                          <button
                            onClick={() => abrirModalEditar(u)}
                            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                            title="Editar usuário ou redefinir senha"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleExcluir(u)}
                            disabled={isEu}
                            className="p-1.5 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors disabled:opacity-40"
                            title="Excluir usuário"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Criar / Editar Usuário */}
      {modalAberto && createPortal(
        <div className="fixed inset-0 top-0 left-0 w-screen h-screen z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={fecharModal}
              className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-1">
              {usuarioEditando ? 'Editar Usuário' : 'Novo Usuário'}
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              {usuarioEditando
                ? `Modifique as permissões ou senha de ${usuarioEditando.nome}`
                : 'Cadastre um novo membro da equipe para acessar o sistema.'}
            </p>

            {erroForm && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
                {erroForm}
              </div>
            )}

            <form onSubmit={handleSalvar} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  disabled={!!usuarioEditando}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="joao@makinsthal.com.br"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {usuarioEditando ? 'Nova Senha (deixe em branco para não alterar)' : 'Senha Inicial'}
                </label>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder={usuarioEditando ? '••••••••' : 'Defina uma senha'}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Perfil de Acesso
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="OPERADOR">OPERADOR (Gerencia Obras, QCs e Faturamentos)</option>
                  <option value="DONO">DONO / ADMIN (Acesso total + Gestão de Usuários e Auditoria)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={fecharModal}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
                >
                  {salvando ? 'Salvando...' : 'Salvar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
