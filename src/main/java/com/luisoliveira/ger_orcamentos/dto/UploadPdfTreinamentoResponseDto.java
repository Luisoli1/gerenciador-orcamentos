package com.luisoliveira.ger_orcamentos.dto;

import java.util.List;

public record UploadPdfTreinamentoResponseDto(
        int totalArquivosProcessados,
        int totalItensExtraidos,
        int totalNovosEnfileirados,
        List<String> arquivos,
        String mensagem
) {}

