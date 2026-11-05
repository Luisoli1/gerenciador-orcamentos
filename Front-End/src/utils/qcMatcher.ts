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

export function extrairChapa(text: string): string | null {
  if (!text) return null;
  const upper = text.toUpperCase();

  // 1. Padrão com CH"16", CH 16, CH.16, CH#16, CHAPA 16, #16
  const match = upper.match(/(?:CHAPA|CH|#)\s*[\."']?\s*#?\s*["']?\s*(12|14|16|18|20|22|24|26)\b["']?/);
  if (match) return `Chapa #${match[1]}`;

  // 2. Cerquilha isolada #16
  const matchHash = upper.match(/#\s*(12|14|16|18|20|22|24|26)\b/);
  if (matchHash) return `Chapa #${matchHash[1]}`;

  // 3. Milímetros (1.25mm -> #18, 1.5mm -> #16, 2.0mm -> #14, 0.9mm -> #20)
  const matchEsp = upper.match(/(?:ESP(?:ESSURA)?|CH(?:APA)?)\.?\s*(?:DE\s*)?(\d+(?:[,\.]\d+)?)\s*MM\b/);
  if (matchEsp) {
    const val = parseFloat(matchEsp[1].replace(',', '.'));
    if (val >= 1.8 && val <= 2.15) return 'Chapa #14';
    if (val >= 1.4 && val <= 1.65) return 'Chapa #16';
    if (val >= 1.15 && val <= 1.35) return 'Chapa #18';
    if (val >= 0.85 && val <= 1.05) return 'Chapa #20';
    if (val >= 0.7 && val <= 0.84) return 'Chapa #22';
    if (val >= 2.5 && val <= 2.9) return 'Chapa #12';
    return `Chapa ${val}mm`;
  }

  return null;
}

export function areItemsEquivalent(descA: string, descB: string): boolean {
  const normA = normalizeDescription(descA);
  const normB = normalizeDescription(descB);

  if (normA === normB) return true;

  // BLOQUEIO CRÍTICO DE INFRAESTRUTURA: ESPESSURA DE CHAPA (#14, #16, #18, #20...)
  // Não mescla chapas diferentes na mesma linha silenciosamente!
  const chapaA = extrairChapa(descA);
  const chapaB = extrairChapa(descB);
  if (chapaA && chapaB && chapaA !== chapaB) {
    return false;
  }

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
        chapa: match?.descricao ? (extrairChapa(match.descricao) || undefined) : undefined,
        descricaoOriginal: match?.descricao || '',
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
