package com.luisoliveira.ger_orcamentos.config;

import jakarta.servlet.MultipartConfigElement;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class UploadConfig {

    @Bean
    public MultipartConfigElement multipartConfigElement() {
        // 100 MB max file size, 100 MB max request size
        long maxUploadSizeBytes = 100L * 1024L * 1024L;
        return new MultipartConfigElement("", maxUploadSizeBytes, maxUploadSizeBytes, 0);
    }
}
