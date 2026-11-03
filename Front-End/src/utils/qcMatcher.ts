import type { QuadroConcorrenciaDto, ConsolidatedItem, ItemQuadroDTO } from '../types';

export function normalizeDescription(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/c\//g, 'com ')
    .replace(/p\//g, 'para ')
    .replace(/s\//g, 'sem ')
    .replace(/[-_.,\/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTokens(text: string): string[] {
  return normalizeDescription(text).split(' ').filter(t => t.length > 0);
}

export function areItemsEquivalent(descA: string, descB: string): boolean {
  const normA = normalizeDescription(descA);
  const normB = normalizeDescription(descB);

  if (normA === normB) return true;

  const tokensA = extractTokens(descA);
  const tokensB = extractTokens(descB);

  const numbersA = tokensA.filter(t => /\d/.test(t));
  const numbersB = tokensB.filter(t => /\d/.test(t));

  if (numbersA.length > 0 && numbersB.length > 0) {
    const hasSameNumbers = numbersA.some(num => numbersB.includes(num));
    if (!hasSameNumbers) return false;
  }

  const commonTokens = tokensA.filter(t => tokensB.includes(t));
  const minLen = Math.min(tokensA.length, tokensB.length);

  if (minLen > 0 && commonTokens.length / minLen >= 0.7) {
    return true;
  }

  return false;
}

export function consolidateQuadro(orcamentos: QuadroConcorrenciaDto[]): ConsolidatedItem[] {
  if (!orcamentos || orcamentos.length === 0) return [];

  const consolidatedList: ConsolidatedItem[] = [];

  orcamentos.forEach((orc) => {
    (orc.itens || []).forEach((item) => {
      const jaExiste = consolidatedList.find(c => areItemsEquivalent(c.descricao, item.descricao));
      if (!jaExiste) {
        consolidatedList.push({
          itemSeq: consolidatedList.length + 1,
          descricao: item.descricao,
          unidadeMedida: item.unidadeMedida || 'PÇ',
          quantidade: item.quantidade || 1,
          quotes: [],
          melhorUnitario: null,
          melhorTotal: null,
        });
      }
    });
  });

  consolidatedList.forEach((row) => {
    let minUnit: number | null = null;
    let minTot: number | null = null;

    orcamentos.forEach((orc) => {
      const match = (orc.itens || []).find((i: ItemQuadroDTO) => areItemsEquivalent(i.descricao, row.descricao));

      const vu = match?.valorUnitario != null ? Number(match.valorUnitario) : null;
      const vt = match?.valorTotal != null ? Number(match.valorTotal) : null;

      if (vu !== null && vu > 0) {
        if (minUnit === null || vu < minUnit) {
          minUnit = vu;
        }
      }

      if (vt !== null && vt > 0) {
        if (minTot === null || vt < minTot) {
          minTot = vt;
        }
      }

      row.quotes.push({
        fornecedorNome: orc.nomeFornecedor,
        valorUnitario: vu,
        valorTotal: vt,
        marca: match?.marca || '',
        isMelhorUnitario: false,
        isMelhorTotal: false,
      });
    });

    row.melhorUnitario = minUnit;
    row.melhorTotal = minTot;

    row.quotes.forEach((q) => {
      if (minUnit !== null && q.valorUnitario !== null && Math.abs(q.valorUnitario - minUnit) < 0.001) {
        q.isMelhorUnitario = true;
      }
      if (minTot !== null && q.valorTotal !== null && Math.abs(q.valorTotal - minTot) < 0.001) {
        q.isMelhorTotal = true;
      }
    });
  });

  return consolidatedList;
}
