import type { QuadroConcorrenciaDto, ConsolidatedItem, ItemQuadroDTO, ConsolidatedQuote } from '../types';

// Catálogo de Marcas Conhecidas para extração automática
export const KNOWN_BRANDS = [
  'TIGRE', 'AMANCO', 'SCHNEIDER', 'STECK', 'WEG', 'LEGRAND', 'PIAL',
  'TRAMONTINA', 'PRYSMIAN', 'SIL', 'ELECON', 'WETZEL', 'MONT MAGNO',
  'SOEDRAL', 'SIEMENS', 'CORFIO', 'COBRECOM', 'OUROLUX', 'G-LIGHT',
  'PHILIPS', 'OSRAM', 'LORENZETTI', 'DAISA', 'MARILIA', 'FAME'
];

export function extrairMarca(text: string): string | null {
  if (!text) return null;
  const upper = text.toUpperCase();
  for (const b of KNOWN_BRANDS) {
    const regex = new RegExp(`\\b${b}\\b`, 'i');
    if (regex.test(upper)) return b;
  }
  return null;
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

  // 3. Milímetros
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

// Extração de fator de conversão de embalagem (ex: RL C/ 50M -> 50, BOBINA 25M -> 25)
export function extrairFatorConversao(desc: string, unidade?: string): number {
  if (!desc) return 1;
  const upper = desc.toUpperCase();

  // 1. Metragem em rolos/bobinas: RL C/ 50M, ROLO C/ 50M, BOBINA 25M, C/ 50M, 50 METROS
  const matchMeters = upper.match(/(?:RL|ROLO|BOBINA|PCT|PACOTE|CX|CAIXA)?\s*(?:C\/|COM)?\s*(\d+)\s*(?:M|METROS)\b/i);
  if (matchMeters) {
    const val = parseInt(matchMeters[1], 10);
    if (val > 1) return val;
  }

  // 2. Unidades em caixas/pacotes: CX C/ 100, PCT C/ 50
  const matchUnits = upper.match(/(?:CX|PCT|PACOTE|CAIXA)\s*(?:C\/|COM)?\s*(\d+)\s*(?:PC|UN|PÇ)?\b/i);
  if (matchUnits) {
    const val = parseInt(matchUnits[1], 10);
    if (val > 1) return val;
  }

  // 3. Se a unidade declarada for RL ou BOBINA e o texto tiver metragem simples
  if (unidade && (unidade.toUpperCase() === 'RL' || unidade.toUpperCase() === 'BOBINA')) {
    const m = upper.match(/(\d+)\s*M/i);
    if (m) return parseInt(m[1], 10);
    return 50; // Padrão convencional de rolo na engenharia
  }

  return 1;
}

// Dicionário técnico de sinônimos da engenharia civil e elétrica
const TECHNICAL_SYNONYMS: Record<string, string> = {
  // Caixas e Acessórios
  'cx': 'caixa',
  'cxa': 'caixa',
  'oct': 'octogonal',
  'octog': 'octogonal',
  'fdo': 'fundo',
  'movel': 'movel',
  'p/': 'para',
  'c/': 'com',
  's/': 'sem',
  // Fios e Cabos
  'fio': 'cabo',
  'condutor': 'cabo',
  'flex': 'flexivel',
  'eletrico': 'eletrico',
  'az': 'azul',
  'vm': 'vermelho',
  'verm': 'vermelho',
  'pr': 'preto',
  'pt': 'preto',
  'am': 'amarelo',
  'vd': 'verde',
  'br': 'branco',
  'bc': 'branco',
  'cz': 'cinza',
  'mr': 'marrom',
  // Eletrodutos e Conduítes
  'eletrod': 'eletroduto',
  'conduite': 'eletroduto',
  'corr': 'corrugado',
  'corrug': 'corrugado',
  'bobina': 'rolo',
  'rl': 'rolo',
  // Lâmpadas e Iluminação
  'lamp': 'lampada',
  'biv': 'bivolt',
  'fria': '6500k',
  'branca fria': '6500k',
  'branca morna': '3000k',
  'branca neutra': '4000k',
  // Disjuntores e Proteção
  'disj': 'disjuntor',
  'mono': '1p',
  'monopolar': '1p',
  'bipolar': '2p',
  'tripolar': '3p',
  // Unidades
  'pc': 'un',
  'und': 'un',
  'pca': 'un'
};

export function normalizeDescription(text: string): string {
  if (!text) return '';
  let res = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/c\//g, 'com ')
    .replace(/p\//g, 'para ')
    .replace(/s\//g, 'sem ');

  // Normalizar dimensões e medidas técnicas
  res = res.replace(/(\d+)[,\.](\d+)\s*mm(?:2|²)?/gi, '$1.$2mm');
  res = res.replace(/(\d+)\/(\d+)\s*(?:pol|"|'')?/gi, '$1/$2');
  res = res.replace(/(\d+)\s*x\s*(\d+)/gi, '$1x$2');
  res = res.replace(/(\d+)\s*w\b/gi, '$1w');
  res = res.replace(/(\d+)\s*a\b/gi, '$1a');
  res = res.replace(/(\d+)\s*v\b/gi, '$1v');
  res = res.replace(/(\d+)\s*k\b/gi, '$1k');

  // Remover pontuações
  res = res.replace(/[-_.,\/()]/g, ' ');

  // Aplicar sinônimos técnicos por tokens
  const tokens = res.split(/\s+/).filter(t => t.length > 0);
  const mapped = tokens.map(t => TECHNICAL_SYNONYMS[t] || t);

  return mapped.join(' ').trim();
}

// Extrai especificações cruciais que não podem divergir
interface CrucialSpecs {
  gauge?: string;       // 2.5mm, 4.0mm, 3/4, 1/2
  dimension?: string;   // 4x4, 4x2
  amperage?: string;    // 20a, 32a
  poles?: string;       // 1p, 2p, 3p
  wattage?: string;     // 9w, 12w
  color?: string;       // azul, vermelho, preto, verde, amarelo, branco
  tempColor?: string;   // 6500k, 3000k, 4000k
}

function extractCrucialSpecs(normText: string): CrucialSpecs {
  const specs: CrucialSpecs = {};

  const mGaugeMm = normText.match(/\b(\d+(?:\.\d+)?mm)\b/);
  if (mGaugeMm) specs.gauge = mGaugeMm[1];

  const mGaugePol = normText.match(/\b(\d+\/\d+)\b/);
  if (mGaugePol) specs.gauge = mGaugePol[1];

  const mDim = normText.match(/\b(\d+x\d+)\b/);
  if (mDim) specs.dimension = mDim[1];

  const mAmp = normText.match(/\b(\d+a)\b/);
  if (mAmp) specs.amperage = mAmp[1];

  const mPole = normText.match(/\b([1-4]p)\b/);
  if (mPole) specs.poles = mPole[1];

  const mWatt = normText.match(/\b(\d+w)\b/);
  if (mWatt) specs.wattage = mWatt[1];

  const colors = ['azul', 'vermelho', 'preto', 'verde', 'amarelo', 'branco', 'cinza'];
  for (const c of colors) {
    if (new RegExp(`\\b${c}\\b`).test(normText)) {
      specs.color = c;
      break;
    }
  }

  const mTemp = normText.match(/\b(\d+k)\b/);
  if (mTemp) specs.tempColor = mTemp[1];

  return specs;
}

export function areItemsEquivalent(descA: string, descB: string): boolean {
  const normA = normalizeDescription(descA);
  const normB = normalizeDescription(descB);

  if (normA === normB) return true;

  // 1. BLOQUEIO DE ESPESSURA DE CHAPA
  const chapaA = extrairChapa(descA);
  const chapaB = extrairChapa(descB);
  if (chapaA && chapaB && chapaA !== chapaB) {
    return false;
  }

  // 2. BLOQUEIO DE ATRIBUTOS CRÍTICOS INCOMPATÍVEIS
  const specsA = extractCrucialSpecs(normA);
  const specsB = extractCrucialSpecs(normB);

  if (specsA.gauge && specsB.gauge && specsA.gauge !== specsB.gauge) return false;
  if (specsA.dimension && specsB.dimension && specsA.dimension !== specsB.dimension) return false;
  if (specsA.amperage && specsB.amperage && specsA.amperage !== specsB.amperage) return false;
  if (specsA.poles && specsB.poles && specsA.poles !== specsB.poles) return false;
  if (specsA.wattage && specsB.wattage && specsA.wattage !== specsB.wattage) return false;
  if (specsA.color && specsB.color && specsA.color !== specsB.color) return false;
  if (specsA.tempColor && specsB.tempColor && specsA.tempColor !== specsB.tempColor) return false;

  // 3. IDENTIFICAÇÃO DE PRODUTOS CANÔNICOS CHAVE DA ENGENHARIA
  // Caixa Octogonal
  const aOct = normA.includes('caixa') && normA.includes('octogonal');
  const bOct = normB.includes('caixa') && normB.includes('octogonal');
  if (aOct && bOct && specsA.dimension === specsB.dimension) return true;

  // Eletroduto Corrugado
  const aEletrod = normA.includes('eletroduto') && normA.includes('corrugado');
  const bEletrod = normB.includes('eletroduto') && normB.includes('corrugado');
  if (aEletrod && bEletrod && specsA.gauge === specsB.gauge) return true;

  // Cabo / Fio Flexível
  const aCabo = normA.includes('cabo') && normA.includes('flexivel');
  const bCabo = normB.includes('cabo') && normB.includes('flexivel');
  if (aCabo && bCabo && specsA.gauge === specsB.gauge && specsA.color === specsB.color) return true;

  // Disjuntor DIN
  const aDisj = normA.includes('disjuntor') && normA.includes('din');
  const bDisj = normB.includes('disjuntor') && normB.includes('din');
  if (aDisj && bDisj && specsA.amperage === specsB.amperage) return true;

  // Lâmpada LED
  const aLamp = normA.includes('lampada') && normA.includes('led');
  const bLamp = normB.includes('lampada') && normB.includes('led');
  if (aLamp && bLamp && specsA.wattage === specsB.wattage) return true;

  // 4. OVERLAP GERAL DE TOKENS (com marcas removidas para não atrapalhar o casamento)
  const tokensA = normA.split(' ').filter(t => t.length > 1 && !KNOWN_BRANDS.map(b => b.toLowerCase()).includes(t));
  const tokensB = normB.split(' ').filter(t => t.length > 1 && !KNOWN_BRANDS.map(b => b.toLowerCase()).includes(t));

  const commonTokens = tokensA.filter(t => tokensB.includes(t));
  const minLen = Math.min(tokensA.length, tokensB.length);

  if (minLen > 0 && commonTokens.length / minLen >= 0.5) {
    return true;
  }

  return false;
}

export function consolidateQuadro(orcamentos: QuadroConcorrenciaDto[]): ConsolidatedItem[] {
  if (!orcamentos || orcamentos.length === 0) return [];

  const consolidatedList: ConsolidatedItem[] = [];

  // 1. Identificar todas as linhas canônicas únicas
  orcamentos.forEach((orc) => {
    (orc.itens || []).forEach((item) => {
      const jaExiste = consolidatedList.find(c => {
        if (c.itemCanonicoId && item.itemCanonicoId) {
          return c.itemCanonicoId === item.itemCanonicoId;
        }
        return areItemsEquivalent(c.descricao, item.descricao);
      });

      if (!jaExiste) {
        // Se a unidade for metro ou houver indicação de metro na lista, priorizar unidade base 'M'
        let baseUnd = item.unidadeMedida || item.unidadeDeMedida || 'UN';
        let baseQtd = item.quantidade || 1;

        // Se o item é eletroduto ou cabo e tem metragem, base unit é 'M'
        const norm = normalizeDescription(item.descricao);
        if ((norm.includes('eletroduto') || norm.includes('cabo')) && (baseUnd.toUpperCase() === 'M' || baseQtd >= 50)) {
          baseUnd = 'M';
        }

        const descFinal = item.nomeCanonico || item.descricao;

        consolidatedList.push({
          itemSeq: consolidatedList.length + 1,
          descricao: descFinal,
          unidadeMedida: baseUnd,
          quantidade: baseQtd,
          quotes: [],
          melhorUnitario: null,
          melhorTotal: null,
          itemCanonicoId: item.itemCanonicoId,
        });
      } else {
        if (item.nomeCanonico && !jaExiste.descricao.includes(item.nomeCanonico)) {
          jaExiste.descricao = item.nomeCanonico;
        }
        if (item.itemCanonicoId && !jaExiste.itemCanonicoId) {
          jaExiste.itemCanonicoId = item.itemCanonicoId;
        }
        // Se outro item do mesmo grupo tem unidade 'M' e quantidade total (ex: 500 M vs 10 RL), nivelar pela unidade base de consumo
        if (item.unidadeMedida?.toUpperCase() === 'M' && jaExiste.unidadeMedida.toUpperCase() !== 'M') {
          jaExiste.unidadeMedida = 'M';
          jaExiste.quantidade = item.quantidade || 1;
        } else if (item.quantidade && item.quantidade > jaExiste.quantidade && jaExiste.unidadeMedida.toUpperCase() === item.unidadeMedida?.toUpperCase()) {
          jaExiste.quantidade = item.quantidade;
        }
      }
    });
  });

  // 2. Preencher as cotações cruzadas com normalização de embalagem e verificação de quantidade
  consolidatedList.forEach((row) => {
    let minUnit: number | null = null;
    let minTot: number | null = null;

    orcamentos.forEach((orc) => {
      const match = (orc.itens || []).find((i: ItemQuadroDTO) => {
        if (row.itemCanonicoId && i.itemCanonicoId) {
          return row.itemCanonicoId === i.itemCanonicoId;
        }
        return areItemsEquivalent(i.descricao, row.descricao);
      });

      let vuOriginal = match?.valorUnitario != null ? Number(match.valorUnitario) : null;
      let vtOriginal = match?.valorTotal != null ? Number(match.valorTotal) : null;
      let qtdOriginal = match?.quantidade != null ? Number(match.quantidade) : null;
      let undOriginal = match?.unidadeDeMedida || match?.unidadeMedida || '';

      let vuNormalizado = vuOriginal;
      let qtdNormalizada = qtdOriginal;
      let fator = 1;

      if (match) {
        fator = extrairFatorConversao(match.descricao, undOriginal);
        // Se o item foi vendido em Rolo/Bobina/Caixa com fator > 1 e a linha do quadro está em Metro ou Unidade avulsa
        if (fator > 1) {
          if (row.unidadeMedida.toUpperCase() === 'M' || row.unidadeMedida.toUpperCase() === 'UN') {
            if (vuOriginal !== null) {
              vuNormalizado = vuOriginal / fator;
            }
            if (qtdOriginal !== null) {
              qtdNormalizada = qtdOriginal * fator;
            }
          }
        }
      }

      // Verificação de divergência de quantidade
      let isDivergente = false;
      let textoDivergente: string | undefined;

      if (qtdNormalizada !== null && row.quantidade) {
        if (Math.abs(qtdNormalizada - row.quantidade) > 0.01) {
          isDivergente = true;
          textoDivergente = `Cotou ${qtdNormalizada} ${row.unidadeMedida} (Obra pediu ${row.quantidade})`;
        }
      }

      // Extração automática da marca
      let marcaFinal = match?.marca || '';
      if (!marcaFinal && match?.descricao) {
        const marcaDetectada = extrairMarca(match.descricao);
        if (marcaDetectada) marcaFinal = marcaDetectada;
      }

      if (vuNormalizado !== null && vuNormalizado > 0) {
        if (minUnit === null || vuNormalizado < minUnit) {
          minUnit = vuNormalizado;
        }
      }

      if (vtOriginal !== null && vtOriginal > 0) {
        if (minTot === null || vtOriginal < minTot) {
          minTot = vtOriginal;
        }
      }

      const quote: ConsolidatedQuote = {
        fornecedorNome: orc.nomeFornecedor,
        valorUnitario: vuNormalizado,
        valorTotal: vtOriginal,
        valorUnitarioOriginal: vuOriginal,
        quantidadeOriginal: qtdOriginal,
        unidadeOriginal: undOriginal,
        fatorConversao: fator > 1 ? fator : undefined,
        isQuantidadeDivergente: isDivergente,
        quantidadeDivergenteTexto: textoDivergente,
        marca: marcaFinal,
        chapa: match?.descricao ? (extrairChapa(match.descricao) || undefined) : undefined,
        descricaoOriginal: match?.descricao || '',
        isMelhorUnitario: false,
        isMelhorTotal: false,
      };

      row.quotes.push(quote);
    });

    row.melhorUnitario = minUnit;
    row.melhorTotal = minTot;

    row.quotes.forEach((q) => {
      if (minUnit !== null && q.valorUnitario !== null && Math.abs(q.valorUnitario - minUnit) < 0.005) {
        q.isMelhorUnitario = true;
      }
      if (minTot !== null && q.valorTotal !== null && Math.abs(q.valorTotal - minTot) < 0.005) {
        q.isMelhorTotal = true;
      }
    });
  });

  return consolidatedList;
}
