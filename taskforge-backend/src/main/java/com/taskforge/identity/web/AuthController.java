package com.taskforge.identity.web;

import com.taskforge.identity.application.AuthService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    public record RegisterRequest(@Email String email, @NotBlank @Size(min = 8) String password, @NotBlank String fullName) {}
    public record LoginRequest(@Email String email, @NotBlank String password) {}
    public record AuthResponse(String accessToken, String userId, String email, String fullName) {}

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest req) {
        var result = authService.register(req.email(), req.password(), req.fullName());
        return new AuthResponse(result.accessToken(), result.user().getId().toString(),
                result.user().getEmail(), result.user().getFullName());
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        var result = authService.login(req.email(), req.password());
        return new AuthResponse(result.accessToken(), result.user().getId().toString(),
                result.user().getEmail(), result.user().getFullName());
    }
}
