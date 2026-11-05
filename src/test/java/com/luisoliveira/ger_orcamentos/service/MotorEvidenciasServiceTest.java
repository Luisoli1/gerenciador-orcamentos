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
        when(itemAliasRepository.buscarMelhorMatchAlias(any(), any())).thenReturn(List.of());

        ResultadoAvaliacaoEvidenciasDto resultado = motorEvidenciasService.avaliarEvidencias(
                "Fio Flex Azul 2,5",
                "M",
                new BigDecimal("150.0"),
                1L,
                "Fornecedor Elétrica ABC",
                caboAzulCanonico,
                BigDecimal.ONE,
                true,
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
    @DisplayName("Cenário 3: Anti-evidência forte - Cor de Cabo Elétrico (Azul vs Vermelho) bloqueia merge")
    void deveBarrarMergeQuandoCoresEletricasForemConflitantes() {
        when(itemAliasRepository.buscarMelhorMatchAlias(any(), any())).thenReturn(List.of());

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
        assertTrue(resultado.alertaConflito().contains("Cor"));
        assertTrue(resultado.confianca() <= 20, "Confiança deve ser travada em <= 20% para atributo bloqueante de cor: " + resultado.confianca());
    }

    @Test
    @DisplayName("Cenário 4: Anti-evidência forte - Bitola de Cabo Elétrico (2.5mm² vs 4.0mm²) bloqueia merge")
    void deveBarrarMergeQuandoBitolasDeCaboForemConflitantes() {
        when(itemAliasRepository.buscarMelhorMatchAlias(any(), any())).thenReturn(List.of());

        ResultadoAvaliacaoEvidenciasDto resultado = motorEvidenciasService.avaliarEvidencias(
                "Cabo Flexível 4,0mm² Azul",
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
        assertTrue(resultado.alertaConflito().contains("Bitola"));
        assertTrue(resultado.confianca() <= 20, "Confiança deve ser travada em <= 20% para bitolas divergentes: " + resultado.confianca());
    }

    @Test
    @DisplayName("Cenário 5: Anti-evidência forte - Polos em Disjuntores (1P vs 3P) bloqueia merge")
    void deveBarrarMergeQuandoPolosDeDisjuntorForemConflitantes() {
        ItemCanonico disjuntorMono = new ItemCanonico(
                "Disjuntor Termomagnético 1P 20A Curva C",
                "DISJUNTOR TERMOMAGNETICO 1P 20A CURVA C",
                "UN",
                "Dispositivos de Proteção",
                "Sistema"
        );
        disjuntorMono.setId(30L);

        when(itemAliasRepository.buscarMelhorMatchAlias(any(), any())).thenReturn(List.of());

        ResultadoAvaliacaoEvidenciasDto resultado = motorEvidenciasService.avaliarEvidencias(
                "Disjuntor Tripolar 20A Curva C",
                "UN",
                new BigDecimal("5.0"),
                1L,
                "Fornecedor Steck",
                disjuntorMono,
                BigDecimal.ONE,
                true,
                false,
                null
        );

        assertNotNull(resultado);
        assertNotNull(resultado.alertaConflito());
        assertTrue(resultado.alertaConflito().contains("Polos"));
        assertTrue(resultado.confianca() <= 20, "Confiança travada em <= 20% para polos incompatíveis: " + resultado.confianca());
    }

    @Test
    @DisplayName("Cenário 6: Anti-evidência forte - Amperagem em Disjuntores (20A vs 32A) bloqueia merge")
    void deveBarrarMergeQuandoAmperagemDeDisjuntorForConflitante() {
        ItemCanonico disjuntor20A = new ItemCanonico(
                "Disjuntor Termomagnético 1P 20A Curva C",
                "DISJUNTOR TERMOMAGNETICO 1P 20A CURVA C",
                "UN",
                "Dispositivos de Proteção",
                "Sistema"
        );
        disjuntor20A.setId(31L);

        when(itemAliasRepository.buscarMelhorMatchAlias(any(), any())).thenReturn(List.of());

        ResultadoAvaliacaoEvidenciasDto resultado = motorEvidenciasService.avaliarEvidencias(
                "Disjuntor Monopolar 32A Curva C",
                "UN",
                new BigDecimal("5.0"),
                1L,
                "Fornecedor Steck",
                disjuntor20A,
                BigDecimal.ONE,
                true,
                false,
                null
        );

        assertNotNull(resultado);
        assertNotNull(resultado.alertaConflito());
        assertTrue(resultado.alertaConflito().contains("Amperagem"));
        assertTrue(resultado.confianca() <= 20, "Confiança travada em <= 20% para amperagens distintas: " + resultado.confianca());
    }

    @Test
    @DisplayName("Cenário 7: Anti-evidência forte - Amperagem em Tomadas (10A vs 20A) bloqueia merge")
    void deveBarrarMergeQuandoAmperagemDeTomadaForConflitante() {
        ItemCanonico tomada10A = new ItemCanonico(
                "Módulo Tomada 2P+T 10A 250V Branco",
                "MODULO TOMADA 2P+T 10A 250V BRANCO",
                "UN",
                "Tomadas e Interruptores",
                "Sistema"
        );
        tomada10A.setId(40L);

        when(itemAliasRepository.buscarMelhorMatchAlias(any(), any())).thenReturn(List.of());

        ResultadoAvaliacaoEvidenciasDto resultado = motorEvidenciasService.avaliarEvidencias(
                "Tomada 20A 250V Pial Plus",
                "UN",
                new BigDecimal("10.0"),
                1L,
                "Fornecedor Legrand",
                tomada10A,
                BigDecimal.ONE,
                true,
                false,
                null
        );

        assertNotNull(resultado);
        assertNotNull(resultado.alertaConflito());
        assertTrue(resultado.alertaConflito().contains("Tomada"));
        assertTrue(resultado.confianca() <= 20, "Confiança travada em <= 20% para tomada 10A vs 20A: " + resultado.confianca());
    }

    @Test
    @DisplayName("Cenário 8: Anti-evidência forte - Diâmetro de Tubulação (20mm vs 25mm) bloqueia merge")
    void deveBarrarMergeQuandoDiametroDeTubulacaoForConflitante() {
        ItemCanonico eletroduto20 = new ItemCanonico(
                "Eletroduto Corrugado 20mm Amarelo",
                "ELETRODUTO CORRUGADO 20MM AMARELO",
                "M",
                "Eletrodutos",
                "Sistema"
        );
        eletroduto20.setId(50L);

        when(itemAliasRepository.buscarMelhorMatchAlias(any(), any())).thenReturn(List.of());

        ResultadoAvaliacaoEvidenciasDto resultado = motorEvidenciasService.avaliarEvidencias(
                "Eletroduto Corrugado 25mm Amarelo",
                "M",
                new BigDecimal("50.0"),
                1L,
                "Fornecedor Tigre",
                eletroduto20,
                BigDecimal.ONE,
                true,
                false,
                null
        );

        assertNotNull(resultado);
        assertNotNull(resultado.alertaConflito());
        assertTrue(resultado.alertaConflito().contains("Diâmetro"));
        assertTrue(resultado.confianca() <= 20, "Confiança travada em <= 20% para diâmetros distintos: " + resultado.confianca());
    }

    @Test
    @DisplayName("Cenário 9: Anti-evidência forte - Tensão em Iluminação (127V vs 220V) bloqueia merge")
    void deveBarrarMergeQuandoTensaoForConflitante() {
        ItemCanonico lampada127V = new ItemCanonico(
                "Lâmpada LED Tubular T8 18W 127V 6500K",
                "LAMPADA LED TUBULAR T8 18W 127V 6500K",
                "UN",
                "Iluminação",
                "Sistema"
        );
        lampada127V.setId(60L);

        when(itemAliasRepository.buscarMelhorMatchAlias(any(), any())).thenReturn(List.of());

        ResultadoAvaliacaoEvidenciasDto resultado = motorEvidenciasService.avaliarEvidencias(
                "Lâmpada LED Tubular T8 18W 220V 6500K",
                "UN",
                new BigDecimal("20.0"),
                1L,
                "Fornecedor Philips",
                lampada127V,
                BigDecimal.ONE,
                true,
                false,
                null
        );

        assertNotNull(resultado);
        assertNotNull(resultado.alertaConflito());
        assertTrue(resultado.alertaConflito().contains("Tensão"));
        assertTrue(resultado.confianca() <= 20, "Confiança travada em <= 20% para 127V vs 220V: " + resultado.confianca());
    }

    @Test
    @DisplayName("Cenário 10: Anti-evidência forte - Acabamento Metálico (Galvanizado a Fogo vs Pré-Zincado) bloqueia merge")
    void deveBarrarMergeQuandoAcabamentoMetalicoForConflitante() {
        ItemCanonico perfiladoGF = new ItemCanonico(
                "Perfilado Perfurado 38x38 Galvanizado a Fogo Barra 6m",
                "PERFILADO PERFURADO 38X38 GALVANIZADO A FOGO BARRA 6M",
                "BARRA",
                "Infraestrutura e Perfilados",
                "Sistema"
        );
        perfiladoGF.setId(70L);

        when(itemAliasRepository.buscarMelhorMatchAlias(any(), any())).thenReturn(List.of());

        ResultadoAvaliacaoEvidenciasDto resultado = motorEvidenciasService.avaliarEvidencias(
                "Perfilado Perfurado 38x38 Pré-Zincado (GE) Barra 6m",
                "BARRA",
                new BigDecimal("15.0"),
                1L,
                "Fornecedor Perfilados Brasil",
                perfiladoGF,
                BigDecimal.ONE,
                true,
                false,
                null
        );

        assertNotNull(resultado);
        assertNotNull(resultado.alertaConflito());
        assertTrue(resultado.alertaConflito().contains("Acabamento"));
        assertTrue(resultado.confianca() <= 20, "Confiança travada em <= 20% para GF vs GE: " + resultado.confianca());
    }
}
