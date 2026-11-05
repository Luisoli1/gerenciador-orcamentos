package com.luisoliveira.ger_orcamentos.service;

import com.luisoliveira.ger_orcamentos.dto.ResultadoAvaliacaoEvidenciasDto;
import com.luisoliveira.ger_orcamentos.model.ItemCanonico;
import com.luisoliveira.ger_orcamentos.repositories.ItemAliasRepository;
import com.luisoliveira.ger_orcamentos.repositories.ItemCatalogoFabricanteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class MotorEvidenciasServiceTest {

    @InjectMocks
    private MotorEvidenciasService motorEvidenciasService;

    @Mock
    private ItemAliasRepository itemAliasRepository;

    @Mock
    private ItemCatalogoFabricanteRepository itemCatalogoFabricanteRepository;

    @Spy
    private ClassificadorTecnicoService classificadorTecnicoService = new ClassificadorTecnicoService();

    private ItemCanonico caboAzulCanonico;

    @BeforeEach
    void setUp() {
        caboAzulCanonico = new ItemCanonico(
                "Cabo Flexível 2,5mm² Azul",
                "CABO FLEXIVEL 2.5MM AZUL",
                "M",
                "Cabos e Fios",
                "Sistema"
        );
        caboAzulCanonico.setCodigoReferencia("COD-CABO-25-AZ");
        caboAzulCanonico.setId(10L);
    }

    @Test
    @DisplayName("Cenário 1: Itens equivalentes com sinônimos técnicos, mesma unidade e quantidade única")
    void deveAvaliarComAltaConfiancaQuandoDescricaoESinonimosCoincidem() {
        // Simula que não há alias prévio ainda (primeiro contato com o item)
        when(itemAliasRepository.buscarMelhorMatchAlias(any(), any())).thenReturn(List.of());

        // Fornecedor A cotou: "Fio Flex Azul 2,5" com 150 M, sendo quantidade única na proposta
        ResultadoAvaliacaoEvidenciasDto resultado = motorEvidenciasService.avaliarEvidencias(
                "Fio Flex Azul 2,5",
                "M",
                new BigDecimal("150.0"),
                1L,
                "Fornecedor Elétrica ABC",
                caboAzulCanonico,
                BigDecimal.ONE,
                true, // quantidade única
                false,
                null
        );

        assertNotNull(resultado);
        assertTrue(resultado.confianca() >= 75, "Confiança deve ser alta por similaridade técnica e quantidade única: " + resultado.confianca());
        assertNull(resultado.alertaConflito(), "Não deve haver conflito de especificação");
        assertTrue(resultado.motivos().stream().anyMatch(m -> m.contains("Unidade idêntica")));
        assertTrue(resultado.motivos().stream().anyMatch(m -> m.contains("Bitola / medida técnica idêntica")));
    }

    @Test
    @DisplayName("Cenário 2: Avaliação cruzada entre fornecedores com quantidade única idêntica (157m)")
    void deveDetectarFingerprintEstruturalPorQuantidadeUnicaEntreFornecedores() {
        ResultadoAvaliacaoEvidenciasDto cross = motorEvidenciasService.avaliarEvidenciasEntreItens(
                "Fio Flex Azul 2,5", "M", new BigDecimal("157.0"), "Fornecedor A", true,
                "Condutor Flexível 750V 2,5mm² Azul", "M", new BigDecimal("157.0"), "Fornecedor B", true,
                caboAzulCanonico, BigDecimal.ONE
        );

        assertNotNull(cross);
        assertTrue(cross.confianca() >= 85, "A confiança deve ser muito alta com fingerprint de quantidade única idêntica: " + cross.confianca());
        assertTrue(cross.motivos().stream().anyMatch(m -> m.contains("Quantidade idêntica")));
        assertTrue(cross.motivos().stream().anyMatch(m -> m.contains("Quantidade única em ambas as propostas")));
    }

    @Test
    @DisplayName("Cenário 3: Anti-evidência - Cores divergentes de cabo elétrico (Azul vs Vermelho) devem ser barradas")
    void deveBarrarMergeQuandoCoresEletricasForemConflitantes() {
        when(itemAliasRepository.buscarMelhorMatchAlias(any(), any())).thenReturn(List.of());

        // Fornecedor cotou Cabo Vermelho, mas mestre é Azul
        ResultadoAvaliacaoEvidenciasDto resultado = motorEvidenciasService.avaliarEvidencias(
                "Cabo Flexível 2,5mm² Vermelho",
                "M",
                new BigDecimal("150.0"),
                1L,
                "Fornecedor A",
                caboAzulCanonico,
                BigDecimal.ONE,
                true,
                false,
                null
        );

        assertNotNull(resultado);
        assertNotNull(resultado.alertaConflito());
        assertTrue(resultado.alertaConflito().contains("Divergência de cor"));
        assertTrue(resultado.confianca() <= 40, "Confiança deve ser travada em <= 40% em caso de conflito de cor");
    }

    @Test
    @DisplayName("Cenário 4: Anti-evidência - Eletroduto Ponta Azul vs Convencional não devem mesclar")
    void deveBarrarMergeQuandoVariantesTecnicasForemConflitantes() {
        ItemCanonico eletrodutoMestre = new ItemCanonico(
                "Eletroduto Corrugado Ponta Azul 20mm",
                "ELETRODUTO CORRUGADO PONTA AZUL 20MM",
                "M",
                "Eletrodutos",
                "Sistema"
        );
        eletrodutoMestre.setCodigoReferencia("REF-PA-20");
        eletrodutoMestre.setId(20L);

        when(itemAliasRepository.buscarMelhorMatchAlias(any(), any())).thenReturn(List.of());

        ResultadoAvaliacaoEvidenciasDto resultado = motorEvidenciasService.avaliarEvidencias(
                "Eletroduto Corrugado Convencional 20mm",
                "M",
                new BigDecimal("100.0"),
                1L,
                "Fornecedor B",
                eletrodutoMestre,
                BigDecimal.ONE,
                true,
                false,
                null
        );

        assertNotNull(resultado);
        assertNotNull(resultado.alertaConflito());
        assertTrue(resultado.alertaConflito().contains("Ponta Azul"));
        assertTrue(resultado.confianca() <= 40, "Confiança deve ser travada em <= 40% para variantes técnicas diferentes");
    }
}
