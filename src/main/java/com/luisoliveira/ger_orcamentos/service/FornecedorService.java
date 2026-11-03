package com.luisoliveira.ger_orcamentos.service;

import com.luisoliveira.ger_orcamentos.dto.FornecedorResponseDto;
import com.luisoliveira.ger_orcamentos.dto.QuadroConcorrenciaDto;
import com.luisoliveira.ger_orcamentos.model.Fornecedor;
import com.luisoliveira.ger_orcamentos.repositories.FornecedorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class FornecedorService {

    private final FornecedorRepository fornecedorRepository;

    public FornecedorService(FornecedorRepository fornecedorRepository) {
        this.fornecedorRepository = fornecedorRepository;
    }

    public Optional<Fornecedor> findByCnpj(String cnpj) {
        return fornecedorRepository.findByCnpj(cnpj);
    }

    public Optional<Fornecedor> findByNome(String nome) {
        return fornecedorRepository.findByNome(nome);
    }

    public Fornecedor salvar(Fornecedor fornecedor) {
        return fornecedorRepository.save(fornecedor);
    }

    @Transactional
    public Fornecedor buscarOuCriarFornecedor(QuadroConcorrenciaDto dto) {
        Fornecedor fornecedor = null;

        if (dto.getCnpjFornecedor() != null && !dto.getCnpjFornecedor().isBlank()) {
            fornecedor = findByCnpj(dto.getCnpjFornecedor()).orElse(null);
        }

        if (fornecedor == null && dto.getNomeFornecedor() != null && !dto.getNomeFornecedor().isBlank()) {
            fornecedor = findByNome(dto.getNomeFornecedor()).orElse(null);
        }

        if (fornecedor == null) {
            Fornecedor novoFornecedor = new Fornecedor(
                    dto.getNomeFornecedor(),
                    dto.getCnpjFornecedor(),
                    dto.getNomeContato(),
                    dto.getEmailContato(),
                    dto.getTelefoneContato(),
                    dto.getCelularContato(),
                    dto.getLocalCidade()
            );
            return salvar(novoFornecedor);
        }

        return fornecedor;
    }

    public List<Fornecedor> listarFornecedores() {
        return fornecedorRepository.findAll();
    }

    public Optional<Fornecedor> buscarPorId(Long id) {
        return fornecedorRepository.findById(id);
    }

    public Optional<FornecedorResponseDto> atualizarFornecedor(Long id, Fornecedor dadosAtualizados) {
        return fornecedorRepository.findById(id).map(fornecedorExistente -> {
            // Atualiza apenas os campos permitidos
            fornecedorExistente.setNome(dadosAtualizados.getNome());
            fornecedorExistente.setCnpj(dadosAtualizados.getCnpj());
            fornecedorExistente.setNomeContato(dadosAtualizados.getNomeContato());
            fornecedorExistente.setEmailContato(dadosAtualizados.getEmailContato());
            fornecedorExistente.setTelefoneContato(dadosAtualizados.getTelefoneContato());
            fornecedorExistente.setCelularContato(dadosAtualizados.getCelularContato());
            fornecedorExistente.setLocalCidade(dadosAtualizados.getLocalCidade());

            Fornecedor salvo = fornecedorRepository.save(fornecedorExistente);
            return new FornecedorResponseDto(salvo.getId(), salvo.getNome(), salvo.getCnpj(), salvo.getNomeContato(), salvo.getEmailContato(), salvo.getTelefoneContato(), salvo.getCelularContato(), salvo.getLocalCidade());
        });
    }

    public List<FornecedorResponseDto> listarFornecedoresDto() {
        return fornecedorRepository.findAll().stream()
                .map(FornecedorResponseDto::fromEntity)
                .toList();
    }

    public Optional<FornecedorResponseDto> buscarPorIdDto(Long id) {
        return fornecedorRepository.findById(id)
                .map(FornecedorResponseDto::fromEntity);
    }
    public void deletarFornecedor(Long id) {
        fornecedorRepository.deleteById(id);
    }
}