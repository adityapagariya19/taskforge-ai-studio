package com.taskforge.platformadmin.web;

import com.taskforge.platformadmin.application.PlatformAdminAuthService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/auth")
public class PlatformAdminAuthController {

    private final PlatformAdminAuthService authService;

    public PlatformAdminAuthController(PlatformAdminAuthService authService) {
        this.authService = authService;
    }

    public record LoginRequest(@Email String email, @NotBlank String password) {}
    public record LoginResponse(String accessToken, String adminId, String fullName) {}

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest req) {
        var result = authService.login(req.email(), req.password());
        return new LoginResponse(result.accessToken(), result.adminId(), result.fullName());
    }
}
