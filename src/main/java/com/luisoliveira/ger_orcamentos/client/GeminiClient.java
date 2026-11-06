package com.luisoliveira.ger_orcamentos.client;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Component;
import org.springframework.util.MimeType;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.ai.chat.messages.UserMessage;

import org.springframework.ai.content.Media;
import java.io.IOException;

@Component
public class GeminiClient {

    private final ChatClient chatClient;

    public GeminiClient(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
    }

    public String enviarPrompt(MultipartFile file) throws IOException {
        byte[] arquivo = file.getBytes();

        ByteArrayResource resource = new ByteArrayResource(arquivo);

        Media media = new Media(new MimeType("application", "pdf"), resource);

        UserMessage mensagem = UserMessage.builder()
                .text("És um assistente especializado em engenharia e extração de dados de cotações, pedidos, DANFEs (Notas Fiscais) e catálogos em PDF.\n" +
                        "\n" +
                        "Analise cuidadosamente TODO o documento PDF anexado do início ao fim.\n" +
                        "\n" +
                        "DIRETRIZ DE VARREDURA EXAUSTIVA (OBRIGATÓRIO):\n" +
                        "- Extraia TODAS as linhas de produtos e materiais presentes na tabela ou lista, sem omitir ou resumir nada. Se houver 10, 30, 50 ou 100 itens na tabela, liste TODOS eles no array 'itens'.\n" +
                        "- Em DANFEs / Notas Fiscais Eletrônicas, leia atentamente a seção 'DADOS DO PRODUTO / SERVIÇO' e extraia cada mercadoria com sua descrição, unidade (UN, PC, M, KG, RL, CX), quantidade e valor unitário.\n" +
                        "- Em Catálogos ou Manuais técnicos, extraia cada material, código de peça, bitola, chapa ou especificação de tubo/conexão/perfil.\n" +
                        "- Não invente produtos que não constem no documento.\n" +
                        "- Se não encontrar data de validade, considere 5 dias corridos após a data de emissão.\n" +
                        "- Preserve os valores monetários exatamente como apresentados no documento (se houver).\n" +
                        "- Mantenha a ortografia correta da língua portuguesa nas descrições técnicas, preservando rigorosamente todas as medidas, polegadas, bitolas, códigos e números técnicos.\n" +
                        "- Retorne APENAS um JSON válido, sem Markdown ou explicações.\n" +
                        "\n" +
                        "ESTRUTURA OBRIGATÓRIA DO JSON:\n" +
                        "\n" +
                        "{\n" +
                        "  \"nomeFornecedor\": \"String\",\n" +
                        "  \"cnpjFornecedor\": \"String\",\n" +
                        "  \"nomeContato\": \"String\",\n" +
                        "  \"telefoneContato\": \"String\",\n" +
                        "  \"celularContato\": \"String\",\n" +
                        "  \"emailContato\": \"String\",\n" +
                        "  \"numeroOrcamento\": \"String\",\n" +
                        "  \"localCidade\": \"String\",\n" +
                        "  \"dataEmissao\": \"String yyyy-MM-dd\",\n" +
                        "  \"dataValidade\": \"String yyyy-MM-dd\",\n" +
                        "  \"valorTotalMercadoria\": \"BigDecimal\",\n" +
                        "  \"valorTotalIpi\": \"BigDecimal\",\n" +
                        "  \"valorTotalGeral\": \"BigDecimal\",\n" +
                        "  \"itens\": [\n" +
                        "    {\n" +
                        "      \"marca\": \"String\",\n" +
                        "      \"descricao\": \"String\",\n" +
                        "      \"unidadeMedida\": \"String\",\n" +
                        "      \"quantidade\": \"BigDecimal\",\n" +
                        "      \"valorUnitario\": \"BigDecimal\",\n" +
                        "      \"valorTotal\": \"BigDecimal\",\n" +
                        "      \"aliquotaIpi\": \"BigDecimal\"\n" +
                        "    }\n" +
                        "  ]\n" +
                        "}\n" +
                        "\n" +
                        "REGRAS ESPECÍFICAS PARA A ELECON:\n" +
                        "\n" +
                        "- A marca deve ser identificada na descrição do produto.\n" +
                        "- Quando houver a indicação isolada \"W\" como identificação de marca, retorne \"WETZEL\".\n" +
                        "- Quando não houver indicação de outra marca, considere \"ELECON\".\n" +
                        "- A coluna \"% IPI\" representa a alíquota percentual de IPI de cada produto.\n" +
                        "- Extraia essa alíquota para o campo \"aliquotaIpi\".\n" +
                        "- Se a alíquota estiver explicitamente zerada, retorne 0.\n" +
                        "- Se não houver informação, retorne null.\n" +
                        "- Não confunda IPI com ICMS ou ST.\n" +
                        "\n" +
                        "REGRAS ESPECÍFICAS PARA A MONT MAGNO:\n" +
                        "CNPJ MONT MAGNO: 62.956.115/0001-01\n" +
                        "- Caso não haja marca na descrição, a marca dos produtos do orçamento mont magno é MONT MAGNO.\n" +
                        "\n" +
                        "REGRAS ESPECÍFICAS PARA A SOEDRAL:\n" +
                        "- A vírgula pode ser da casa decimal, por exemplo 1,000 é mil.\n" +
                        "\n" +
                        "REGRAS OBRIGATÓRIAS PARA O RESUMO FINANCEIRO:\n" +
                        "\n" +
                        "ATENÇÃO: O resumo financeiro pode estar localizado no FINAL do documento, separado da tabela de produtos.\n" +
                        "\n" +
                        "Procure especificamente por expressões como:\n" +
                        "- \"VALOR TOTAL DA MERCADORIA\"\n" +
                        "- \"VALOR IPI\"\n" +
                        "- \"VALOR TOTAL DA COTAÇÃO\"\n" +
                        "\n" +
                        "Extraia individualmente os valores apresentados nessas linhas:\n" +
                        "\n" +
                        "- \"valorTotalMercadoria\": valor correspondente a VALOR TOTAL DA MERCADORIA.\n" +
                        "- \"valorTotalIpi\": valor correspondente a VALOR IPI.\n" +
                        "- \"valorTotalGeral\": valor correspondente a VALOR TOTAL DA COTAÇÃO.\n" +
                        "\n" +
                        "IMPORTANTE:\n" +
                        "- Esses três campos devem representar os valores do resumo financeiro do documento, e não valores calculados a partir dos itens.\n" +
                        "- Não confunda o total da mercadoria com o total da cotação.\n" +
                        "- Não utilize apenas a soma dos itens para preencher esses campos.\n" +
                        "- Não some novamente o IPI ao valor total da cotação.\n" +
                        "- Se os valores estiverem impressos no documento, priorize sempre os valores impressos.\n" +
                        "- Se algum valor realmente não estiver disponível, retorne null.\n" +
                        "\n" +
                        "REGRA DE EXTRAÇÃO DO RESUMO FINANCEIRO:\n" +
                        "\n" +
                        "O resumo financeiro localizado no rodapé do orçamento é uma informação obrigatória da extração.\n" +
                        "\n" +
                        "Procure visualmente no final do PDF as expressões \"VALOR TOTAL DA MERCADORIA\", \"VALOR IPI\" e \"VALOR TOTAL DA COTAÇÃO\".\n" +
                        "\n" +
                        "Não considere a extração concluída antes de verificar essas informações.\n" +
                        "\n" +
                        "Retorne os três valores nos campos valorTotalMercadoria, valorTotalIpi e valorTotalGeral.\n" +
                        "\n" +
                        "Se o documento apresentar esses valores, é obrigatório utilizar os números impressos, mesmo que existam pequenas diferenças em relação aos cálculos realizados a partir dos itens.\n" +
                        "\n" +
                        "Nunca retorne null para esses campos sem antes verificar o rodapé do documento.")
                .media(media)
                .build();

        return chatClient.prompt()
                .messages(mensagem)
                .call()
                .content();
    }

    public String enviarPromptTexto(String textoExtraido, String nomeArquivo) {
        String prompt = "És um engenheiro e assistente especializado em extração de materiais, cotações comerciais, pedidos, DANFEs e catálogos técnicos de construção civil (hidráulica, elétrica, fixação, infraestrutura).\n" +
                "\n" +
                "Analise minuciosamente TODO o texto abaixo extraído do arquivo '" + (nomeArquivo != null ? nomeArquivo : "documento.pdf") + "' e extraia TODOS os produtos e materiais listados do início ao fim.\n" +
                "\n" +
                "DIRETRIZ DE VARREDURA EXAUSTIVA (OBRIGATÓRIO):\n" +
                "- Extraia TODAS as linhas de produtos, itens, peças, tubos, conexões, cabos, parafusos, eletrodutos, perfilados e equipamentos da tabela ou lista. É expressamente proibido resumir, agrupar ou omitir itens. Se o documento contiver 10, 30, 50 ou 100 produtos listados, retorne TODOS eles no array 'itens'.\n" +
                "- O documento pode ser uma Cotação Comercial, um Pedido de Compra, uma DANFE / Nota Fiscal Eletrônica (tabela de 'DADOS DO PRODUTO / SERVIÇO') ou um Catálogo / Manual técnico.\n" +
                "- Em DANFEs / Notas Fiscais: extraia o nome/especificação da mercadoria da coluna de descrição de produtos, a unidade (UN, PC, M, KG, RL, CX), a quantidade e o valor unitário.\n" +
                "- Em Catálogos ou Manuais técnicos: identifique e extraia todos os materiais, conexões, bitolas, chapas e peças com suas especificações (ex: 'PERFILADO PERFURADO 38X38X6000MM CHAPA 16', 'TUBO TERMOFUSÃO ACQUA SYSTEM SDR 11 PN 20 25MM'). Se não houver valores monetários no catálogo, retorne null nos valores e 1 na quantidade.\n" +
                "- Não invente produtos que não constem no texto.\n" +
                "- Se um campo não estiver visível ou seguro, retorne null.\n" +
                "- Preserve os valores monetários e quantidades exatamente como apresentados no documento (se houver).\n" +
                "- Mantenha a ortografia correta da língua portuguesa nas descrições técnicas, preservando rigorosamente todas as medidas, polegadas, bitolas, códigos e números técnicos.\n" +
                "- Retorne APENAS um JSON válido, sem Markdown ou explicações.\n" +
                "\n" +
                "ESTRUTURA OBRIGATÓRIA DO JSON:\n" +
                "\n" +
                "{\n" +
                "  \"nomeFornecedor\": \"String\",\n" +
                "  \"cnpjFornecedor\": \"String\",\n" +
                "  \"nomeContato\": \"String\",\n" +
                "  \"telefoneContato\": \"String\",\n" +
                "  \"celularContato\": \"String\",\n" +
                "  \"emailContato\": \"String\",\n" +
                "  \"numeroOrcamento\": \"String\",\n" +
                "  \"localCidade\": \"String\",\n" +
                "  \"dataEmissao\": \"String yyyy-MM-dd\",\n" +
                "  \"dataValidade\": \"String yyyy-MM-dd\",\n" +
                "  \"valorTotalMercadoria\": \"BigDecimal\",\n" +
                "  \"valorTotalIpi\": \"BigDecimal\",\n" +
                "  \"valorTotalGeral\": \"BigDecimal\",\n" +
                "  \"itens\": [\n" +
                "    {\n" +
                "      \"marca\": \"String\",\n" +
                "      \"descricao\": \"String\",\n" +
                "      \"unidadeMedida\": \"String\",\n" +
                "      \"quantidade\": \"BigDecimal\",\n" +
                "      \"valorUnitario\": \"BigDecimal\",\n" +
                "      \"valorTotal\": \"BigDecimal\",\n" +
                "      \"aliquotaIpi\": \"BigDecimal\"\n" +
                "    }\n" +
                "  ]\n" +
                "}\n" +
                "\n" +
                "TEXTO DO DOCUMENTO:\n" +
                textoExtraido;

        return chatClient.prompt()
                .user(prompt)
                .call()
                .content();
    }

    public String conciliarItensComIa(String jsonItens) {
        String prompt = "Você é um Engenheiro de Custos sênior especialista em suprimentos e conciliação de compras para construção civil (instalações elétricas, hidráulica, combate a incêndio, pintura, alvenaria, estrutura metálica e acabamentos).\n\n" +
                "Recebemos cotações de diferentes fornecedores para uma obra. Cada fornecedor escreve os materiais com abreviações, marcas ou embalagens comerciais diferentes (ex: um chama de 'CX OCTOG FDO MOVEL 4X4 TIGRE', outro de 'CAIXA OCT 4X4 P/ LAJE'; um vende eletroduto por metro '500 M', outro por rolo '10 RL C/ 50M', outro por '20 BOBINA 25M'; um escreve 'CABO FLEXIVEL 2,5MM 750V AZUL', outro 'FIO FLEXIVEL 2,5MM 750V AZ').\n\n" +
                "SUA MISSÃO:\n" +
                "Analise cuidadosamente todos os itens abaixo de todos os fornecedores e AGRUPE-OS por correspondência semântica e técnica real. Identifique quais itens representam rigorosamente o MESMO material que deve ser comparado na mesma linha da concorrência.\n\n" +
                "REGRAS OBRIGATÓRIAS DE ENGENHARIA:\n" +
                "1. Materiais idênticos devem ser agrupados no mesmo grupo (ex: Caixa Octogonal 4x4, Cabo Flexível 2.5mm Azul, Eletroduto Corrugado 3/4\", Lâmpada LED 9W, Disjuntor DIN 1P 20A).\n" +
                "2. NÃO junte bitolas, espessuras ou amperagens diferentes (ex: Cabo 2.5mm NUNCA pode juntar com Cabo 4.0mm; Disjuntor 20A NUNCA pode juntar com 32A; Chapa 14 NUNCA junta com Chapa 18; Tubo 25mm NUNCA junta com Tubo 50mm).\n" +
                "3. Detecte FATOR DE CONVERSÃO DE EMBALAGEM: Se um fornecedor vendeu por rolo ou caixa (ex: rolo com 50m, bobina 25m, caixa com 100), indique o fatorConversao para nivelar com a unidade de consumo (M ou UN). Se não houver conversão, retorne 1.\n" +
                "4. Extraia a MARCA do produto se estiver citada no texto (ex: TIGRE, SIL, STECK, AMANCO, WEG, PIAL, etc.). Se não houver, deixe string vazia \"\".\n" +
                "5. Defina um nomeCanonico limpo, formal e padronizado para o material mestre.\n\n" +
                "ITENS RECEBIDOS DOS FORNECEDORES:\n" +
                jsonItens + "\n\n" +
                "Retorne APENAS um JSON válido no formato abaixo, sem formatação markdown ou textos adicionais:\n" +
                "{\n" +
                "  \"grupos\": [\n" +
                "    {\n" +
                "      \"nomeCanonico\": \"Nome Padronizado da Engenharia\",\n" +
                "      \"unidadePadrao\": \"M ou UN ou KG\",\n" +
                "      \"itens\": [\n" +
                "        {\n" +
                "          \"fornecedor\": \"Nome do Fornecedor\",\n" +
                "          \"descricaoOriginal\": \"Descrição exata do fornecedor\",\n" +
                "          \"marca\": \"Marca\",\n" +
                "          \"fatorConversao\": 1\n" +
                "        }\n" +
                "      ]\n" +
                "    }\n" +
                "  ]\n" +
                "}";

        return chatClient.prompt()
                .user(prompt)
                .call()
                .content();
    }
}
