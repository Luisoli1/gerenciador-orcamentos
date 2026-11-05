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
                .text("És um assistente especializado em extração de dados de cotações comerciais em PDF.\n" +
                        "\n" +
                        "Analise cuidadosamente TODO o documento PDF anexado, incluindo cabeçalho, tabela de produtos, rodapé e resumo financeiro.\n" +
                        "\n" +
                        "REGRAS GERAIS:\n" +
                        "- Não invente informações que não estejam presentes no documento.\n" +
                        "- Não deduza a marca do produto pelo nome do fornecedor.\n" +
                        "- Se um campo não estiver visível ou seguro, retorne null.\n" +
                        "- Se não encontrar data de validade, considere 5 dias corridos após a data de emissão.\n" +
                        "- Preserve os valores monetários exatamente como apresentados no documento.\n" +
                        "- Mantenha e aplique a correta ortografia e acentuação da língua portuguesa nas descrições dos materiais e produtos (por exemplo: 'Abraçadeira' e não 'Abracadeira', 'Vergalhão' e não 'Vergalhao', 'Aço' e não 'Aco'), preservando rigorosamente todas as medidas, polegadas, bitolas, códigos e números técnicos.\n" +
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
        String prompt = "És um engenheiro e assistente especializado em extração de materiais, cotações comerciais e catálogos técnicos de construção civil (hidráulica, elétrica, fixação, infraestrutura).\n" +
                "\n" +
                "Analise cuidadosamente TODO o texto abaixo extraído do arquivo '" + (nomeArquivo != null ? nomeArquivo : "documento.pdf") + "' e extraia todos os produtos/materiais, descrições técnicas completas, unidades e dados do documento.\n" +
                "\n" +
                "REGRAS GERAIS:\n" +
                "- Quando o documento for um CATÁLOGO, MANUAL TÉCNICO ou LISTA DE PRODUTOS: identifique e extraia TODOS os materiais, tubos, conexões, ferramentas, curvas, perfilados, suportes e peças listados nas tabelas e especificações técnicas. Extraia a descrição técnica completa com diâmetros, polegadas, chapas, bitolas e códigos (ex: 'PERFILADO PERFURADO 38X38X6000MM CHAPA 16', 'TUBO TERMOFUSÃO ACQUA SYSTEM SDR 11 PN 20 25MM', 'ABRAÇADEIRA TIPO D 2 POL COM PARAFUSO').\n" +
                "- Se o catálogo ou manual não trouxer valores monetários ou quantidades, preencha os valores com null e quantidade com 1.\n" +
                "- Não deduza a marca do produto pelo nome do fornecedor.\n" +
                "- Não invente produtos que não estejam mencionados no texto do documento.\n" +
                "- Se um campo não estiver visível ou seguro, retorne null.\n" +
                "- Preserve os valores monetários exatamente como apresentados no texto (se houver).\n" +
                "- Mantenha e aplique a correta ortografia e acentuação da língua portuguesa nas descrições dos materiais e produtos (por exemplo: 'Abraçadeira' e não 'Abracadeira', 'Vergalhão' e não 'Vergalhao', 'Aço' e não 'Aco'), preservando rigorosamente todas as medidas, polegadas, bitolas, códigos e números técnicos.\n" +
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
}
