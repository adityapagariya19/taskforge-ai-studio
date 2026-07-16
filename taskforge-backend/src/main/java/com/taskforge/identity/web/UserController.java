package com.taskforge.identity.web;

import com.taskforge.common.exception.ApiException;
import com.taskforge.identity.domain.User;
import com.taskforge.identity.infrastructure.UserRepository;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public record UserResponse(String id, String email, String fullName, String avatarUrl) {}

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal UUID userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> ApiException.notFound("User not found"));
        return new UserResponse(user.getId().toString(), user.getEmail(), user.getFullName(), user.getAvatarUrl());
    }
}
