/**
 * Utilitário inteligente de downloads para QC e Faturamentos Diretos
 * Permite ao usuário escolher o local onde salvar no Windows (File System Access API)
 * ou baixar diretamente na pasta padrão do navegador.
 */

export type DownloadMode = 'salvar_como' | 'direto_downloads';

const STORAGE_KEY_PREFIX = 'makinsthal_download_mode_';

export function getDownloadPreference(userId?: number): DownloadMode {
  const key = `${STORAGE_KEY_PREFIX}${userId || 'default'}`;
  const saved = localStorage.getItem(key);
  if (saved === 'salvar_como' || saved === 'direto_downloads') {
    return saved;
  }
  // Padrão: 'salvar_como' se o navegador tiver suporte a showSaveFilePicker, senão 'direto_downloads'
  return typeof window !== 'undefined' && 'showSaveFilePicker' in window ? 'salvar_como' : 'direto_downloads';
}

export function setDownloadPreference(mode: DownloadMode, userId?: number): void {
  const key = `${STORAGE_KEY_PREFIX}${userId || 'default'}`;
  localStorage.setItem(key, mode);
}

/**
 * Salva um Blob no computador respeitando a preferência do usuário.
 * Retorna true se salvou ou false se o usuário cancelou a janela de seleção.
 */
export async function salvarArquivo(
  blob: Blob,
  nomeArquivoPadrao: string,
  userId?: number
): Promise<boolean> {
  const mode = getDownloadPreference(userId);
  const extension = nomeArquivoPadrao.includes('.') 
    ? nomeArquivoPadrao.split('.').pop()?.toLowerCase() || 'xlsx' 
    : 'xlsx';

  // Se o modo for 'salvar_como' e o navegador suportar showSaveFilePicker (Chrome, Edge, Opera no Windows)
  if (mode === 'salvar_como' && typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
    try {
      const pickerOptions: any = {
        suggestedName: nomeArquivoPadrao,
        types: [
          extension === 'xlsx'
            ? {
                description: 'Planilha Excel (*.xlsx)',
                accept: {
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                },
              }
            : {
                description: 'Documento PDF (*.pdf)',
                accept: { 'application/pdf': ['.pdf'] },
              },
        ],
      };

      const handle = await (window as any).showSaveFilePicker(pickerOptions);
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Usuário fechou ou cancelou a janela de salvar - não faz nada
        return false;
      }
      console.warn("showSaveFilePicker falhou, utilizando download tradicional:", err);
    }
  }

  // Fallback tradicional (baixa na pasta Downloads do navegador)
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', nomeArquivoPadrao);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  return true;
}
