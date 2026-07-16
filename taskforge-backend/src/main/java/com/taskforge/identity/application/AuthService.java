package com.taskforge.identity.application;

import com.taskforge.common.exception.ApiException;
import com.taskforge.identity.domain.User;
import com.taskforge.identity.infrastructure.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public record AuthResult(String accessToken, User user) {}

    public AuthResult register(String email, String rawPassword, String fullName) {
        if (userRepository.existsByEmail(email)) {
            throw ApiException.badRequest("Email already registered");
        }
        User user = new User(email, passwordEncoder.encode(rawPassword), fullName);
        userRepository.save(user);
        String token = jwtService.generateAccessToken(user.getId(), email);
        return new AuthResult(token, user);
    }

    public AuthResult login(String email, String rawPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> ApiException.unauthorized("Invalid credentials"));
        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw ApiException.unauthorized("Invalid credentials");
        }
        String token = jwtService.generateAccessToken(user.getId(), email);
        return new AuthResult(token, user);
    }
}
