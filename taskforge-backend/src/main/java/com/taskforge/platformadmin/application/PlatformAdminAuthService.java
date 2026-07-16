package com.taskforge.platformadmin.application;

import com.taskforge.common.exception.ApiException;
import com.taskforge.identity.application.JwtService;
import com.taskforge.platformadmin.domain.PlatformAdmin;
import com.taskforge.platformadmin.infrastructure.PlatformAdminRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;

/**
 * Deliberately no self-registration endpoint. Platform admin accounts are
 * provisioned directly (e.g. via a one-time seed migration or a future
 * `taskforge-admin create` CLI) — a public "become a platform admin" signup
 * form would defeat the entire point of a separate, trusted admin tier.
 */
@Service
public class PlatformAdminAuthService {

    private final PlatformAdminRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public PlatformAdminAuthService(PlatformAdminRepository repository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public record LoginResult(String accessToken, String adminId, String fullName) {}

    public LoginResult login(String email, String rawPassword) {
        PlatformAdmin admin = repository.findByEmail(email)
                .orElseThrow(() -> ApiException.unauthorized("Invalid admin credentials"));
        if (!passwordEncoder.matches(rawPassword, admin.getPasswordHash())) {
            throw ApiException.unauthorized("Invalid admin credentials");
        }
        admin.setLastLoginAt(Instant.now());
        repository.save(admin);
        String token = jwtService.generatePlatformAdminToken(admin.getId(), admin.getEmail());
        return new LoginResult(token, admin.getId().toString(), admin.getFullName());
    }
}
