package com.luisoliveira.ger_orcamentos.service;

import com.luisoliveira.ger_orcamentos.model.EngenheiroObra;
import com.luisoliveira.ger_orcamentos.model.Obra;
import com.luisoliveira.ger_orcamentos.repositories.ObraRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ObraService {

    @Autowired
    private ObraRepository obraRepository;

    public Obra criarObra(Obra obra) {
        // Validação separada 1: Nome da obra único
        if (obraRepository.existsByNomeObraIgnoreCase(obra.getNomeObra())) {
            throw new RuntimeException("Erro: Já existe uma obra cadastrada com o nome '" + obra.getNomeObra() + "'.");
        }

        // Validação separada 2: CNPJ único
        if (obraRepository.existsByCnpjCliente(obra.getCnpjCliente())) {
            throw new RuntimeException("Erro: Já existe uma obra cadastrada para o CNPJ informado (" + obra.getCnpjCliente() + ").");
        }

        if (obra.getEngenheiros() != null && !obra.getEngenheiros().isEmpty()) {
            ajustarEngenheiroPrincipal(obra.getEngenheiros());
            for (EngenheiroObra e : obra.getEngenheiros()) {
                e.setObra(obra);
            }
        }

        return obraRepository.save(obra);
    }

    public List<Obra> listarObras() {
        return obraRepository.findAll();
    }

    public Optional<Obra> buscarPorId(Long id) {
        return obraRepository.findById(id);
    }

    public Obra atualizarObra(Long id, Obra obraAtualizada) {
        return obraRepository.findById(id)
                .map(obraExistente -> {
                    // Validação separada de nome na atualização (evita conflito com outra obra)
                    if (obraRepository.existsByNomeObraIgnoreCaseAndIdNot(obraAtualizada.getNomeObra(), id)) {
                        throw new RuntimeException("Erro: Já existe outra obra cadastrada com este nome.");
                    }

                    // Validação separada de CNPJ na atualização (evita conflito com outra obra)
                    if (obraRepository.existsByCnpjClienteAndIdNot(obraAtualizada.getCnpjCliente(), id)) {
                        throw new RuntimeException("Erro: O CNPJ informado já pertence a outra obra no sistema.");
                    }

                    obraExistente.setNomeObra(obraAtualizada.getNomeObra());
                    obraExistente.setNomeCliente(obraAtualizada.getNomeCliente());
                    obraExistente.setCnpjCliente(obraAtualizada.getCnpjCliente());
                    obraExistente.setEnderecoObra(obraAtualizada.getEnderecoObra());
                    obraExistente.setCepObra(obraAtualizada.getCepObra());
                    obraExistente.setTelefoneCliente(obraAtualizada.getTelefoneCliente());
                    obraExistente.setEmailCliente(obraAtualizada.getEmailCliente());
                    obraExistente.setContatoCliente(obraAtualizada.getContatoCliente());
                    obraExistente.setEnderecoEntrega(obraAtualizada.getEnderecoEntrega());
                    obraExistente.setCepEntrega(obraAtualizada.getCepEntrega());
                    obraExistente.setTelefoneEntrega(obraAtualizada.getTelefoneEntrega());
                    obraExistente.setEmailEntrega(obraAtualizada.getEmailEntrega());
                    obraExistente.setContatoEntrega(obraAtualizada.getContatoEntrega());
                    obraExistente.setNumeroContrato(obraAtualizada.getNumeroContrato());

                    if (obraAtualizada.getEngenheiros() != null) {
                        ajustarEngenheiroPrincipal(obraAtualizada.getEngenheiros());
                        obraExistente.getEngenheiros().clear();
                        for (EngenheiroObra e : obraAtualizada.getEngenheiros()) {
                            e.setObra(obraExistente);
                            obraExistente.getEngenheiros().add(e);
                        }
                    }

                    return obraRepository.save(obraExistente);
                })
                .orElseThrow(() -> new RuntimeException("Obra não encontrada com o ID: " + id));
    }

    private void ajustarEngenheiroPrincipal(List<EngenheiroObra> lista) {
        if (lista == null || lista.isEmpty()) return;
        boolean temPrincipal = false;
        for (EngenheiroObra e : lista) {
            if (Boolean.TRUE.equals(e.getPrincipal())) {
                if (temPrincipal) {
                    e.setPrincipal(false); // apenas um pode ser o principal
                } else {
                    temPrincipal = true;
                }
            }
        }
        // Se nenhum estiver marcado como principal, define o primeiro como principal
        if (!temPrincipal && !lista.isEmpty()) {
            lista.get(0).setPrincipal(true);
        }
    }

    public void deletarObra(Long id) {
        if (obraRepository.existsById(id)) {
            obraRepository.deleteById(id);
        } else {
            throw new RuntimeException("Obra não encontrada com o ID: " + id);
        }
    }
}
