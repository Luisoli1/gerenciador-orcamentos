package com.luisoliveira.ger_orcamentos.dto;

import java.util.List;

public record UploadPdfTreinamentoResponseDto(
        int totalArquivosProcessados,
        int totalItensExtraidos,
        int totalNovosEnfileirados,
        List<String> arquivos,
        String mensagem,
        List<String> erros
) {
    public UploadPdfTreinamentoResponseDto(
            int totalArquivosProcessados,
            int totalItensExtraidos,
            int totalNovosEnfileirados,
            List<String> arquivos,
            String mensagem) {
        this(totalArquivosProcessados, totalItensExtraidos, totalNovosEnfileirados, arquivos, mensagem, List.of());
    }
}
