package com.luisoliveira.ger_orcamentos.controller;



import com.luisoliveira.ger_orcamentos.dto.QuadroComparativoDto;
import com.luisoliveira.ger_orcamentos.dto.QuadroConcorrenciaDto;
import com.luisoliveira.ger_orcamentos.service.OrcamentoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/orcamentos")
public class OrcamentoController {

    @Autowired
    private OrcamentoService orcamentoService;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadOrcamento(@RequestParam("files") List<MultipartFile> files) {
        if(files.size() ==1){
            QuadroConcorrenciaDto resultado = orcamentoService.processarUploadOrcamento(files.get(0));
            return ResponseEntity.ok(resultado);
        }else{
            QuadroComparativoDto comparativoDto = orcamentoService.processarMultiplos(files);
            return ResponseEntity.ok(comparativoDto);
        }
    }




}
